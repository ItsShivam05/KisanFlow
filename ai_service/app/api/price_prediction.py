"""
FastAPI Routes for Jharkhand Price Prediction & Farmer Profit Advisor.
"""

from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
from fastapi import APIRouter, HTTPException

from ai_service.app.config import settings
from ai_service.app.pricing.price_data import (
    JHARKHAND_MARKETS,
    SUPPORTED_COMMODITIES,
    generate_jharkhand_synthetic_price_data,
    clean_and_validate_price_data,
)
from ai_service.app.pricing.price_features import generate_price_features
from ai_service.app.pricing.price_model import JharkhandPriceModelRegistry
from ai_service.app.pricing.price_forecast import run_recursive_price_forecast
from ai_service.app.pricing.profit_optimizer import FarmerProfitOptimizer
from ai_service.app.schemas.pricing import (
    PricePredictRequest,
    PricePredictResponse,
    DailyPriceForecast,
    FarmerProfitRecommendationRequest,
    FarmerProfitRecommendationResponse,
    MarketRecommendationItem,
    MarketAllocationRequest,
    MarketAllocationResponse,
    MarketAllocationItem,
    JharkhandMarketInfo,
    ModelMetricsResponse,
)
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Price Prediction & Farmer Profit Optimization"])

# Global in-memory cache for registry, dataset, and optimizer
_REGISTRY: Optional[JharkhandPriceModelRegistry] = None
_FEATURE_DF: Optional[pd.DataFrame] = None
_OPTIMIZER: Optional[FarmerProfitOptimizer] = None


def get_optimizer() -> FarmerProfitOptimizer:
    global _OPTIMIZER
    if _OPTIMIZER is None:
        _OPTIMIZER = FarmerProfitOptimizer()
    return _OPTIMIZER


def get_registry_and_data() -> tuple[JharkhandPriceModelRegistry, pd.DataFrame]:
    """
    Lazy-load or auto-initialize Jharkhand price models and engineered feature dataset.
    """
    global _REGISTRY, _FEATURE_DF
    if _REGISTRY is not None and _FEATURE_DF is not None:
        return _REGISTRY, _FEATURE_DF

    model_path = Path(settings.JHARKHAND_PRICE_MODEL_PATH)
    proc_path = Path(settings.JHARKHAND_PROCESSED_PRICE_PATH)
    raw_path = Path(settings.JHARKHAND_RAW_PRICE_PATH)

    # 1. Initialize dataset if missing
    if not proc_path.exists():
        logger.info(f"Jharkhand processed price data not found at {proc_path}. Generating baseline...")
        if not raw_path.exists():
            raw_path.parent.mkdir(parents=True, exist_ok=True)
            raw_df = generate_jharkhand_synthetic_price_data()
            raw_df.to_csv(raw_path, index=False)
            logger.info(f"Persisted synthetic Jharkhand raw price dataset: {len(raw_df)} records.")
        else:
            raw_df = pd.read_csv(raw_path)

        clean_df = clean_and_validate_price_data(raw_df)
        proc_df = generate_price_features(clean_df)
        proc_path.parent.mkdir(parents=True, exist_ok=True)
        proc_df.to_csv(proc_path, index=False)
        logger.info(f"Persisted engineered Jharkhand price features: {len(proc_df)} records.")
    else:
        proc_df = pd.read_csv(proc_path)

    _FEATURE_DF = proc_df

    # 2. Initialize models if missing
    registry = JharkhandPriceModelRegistry(storage_path=str(model_path))
    if model_path.exists():
        try:
            registry.load()
            logger.info(f"Loaded existing Jharkhand price models from {model_path}")
        except Exception as err:
            logger.warning(f"Could not load existing model from {model_path} ({err}). Retraining...")
            registry.train_all(proc_df)
            registry.save()
    else:
        logger.info(f"Training fresh Jharkhand price models and persisting to {model_path}...")
        registry.train_all(proc_df)
        registry.save()

    _REGISTRY = registry
    return _REGISTRY, _FEATURE_DF


@router.get("/price-markets", response_model=List[JharkhandMarketInfo])
def get_price_markets():
    """Retrieve supported Jharkhand regional mandis and geographical metadata."""
    markets: List[JharkhandMarketInfo] = []
    for region, meta in JHARKHAND_MARKETS.items():
        markets.append(JharkhandMarketInfo(
            id=region.lower(),
            name=region,
            latitude=meta["latitude"],
            longitude=meta["longitude"],
            market_type=meta["market_type"],
            mandi_name=meta["mandi_name"],
            district=meta["district"],
            avg_daily_capacity_tonnes=meta["avg_daily_capacity_tonnes"],
        ))
    return markets


@router.get("/price-commodities")
def get_price_commodities():
    """Retrieve supported commodities and their baseline attributes."""
    return {
        "commodities": list(SUPPORTED_COMMODITIES.keys()),
        "metadata": SUPPORTED_COMMODITIES,
    }


@router.get("/price-model-metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """Retrieve out-of-sample benchmark metrics comparing XGBoost against Naive and 7-day MA baselines."""
    registry, _ = get_registry_and_data()
    all_metrics: Dict[str, Any] = {}
    baseline_comp: Dict[str, Any] = {}

    for commodity, model in registry.models.items():
        all_metrics[commodity] = {
            "xgb_mae": model.metrics.get("mae", 0.0),
            "xgb_rmse": model.metrics.get("rmse", 0.0),
            "xgb_mape_pct": model.metrics.get("mape_pct", 0.0),
        }
        baseline_comp[commodity] = {
            "naive_mae": model.baseline_metrics.get("naive", {}).get("mae", 0.0),
            "naive_rmse": model.baseline_metrics.get("naive", {}).get("rmse", 0.0),
            "ma7_mae": model.baseline_metrics.get("moving_average_7d", {}).get("mae", 0.0),
            "ma7_rmse": model.baseline_metrics.get("moving_average_7d", {}).get("rmse", 0.0),
            "mae_improvement_over_naive_pct": round(
                ((model.baseline_metrics.get("naive", {}).get("mae", 1.0) - model.metrics.get("mae", 0.0))
                 / max(0.01, model.baseline_metrics.get("naive", {}).get("mae", 1.0))) * 100.0, 1
            ),
        }

    return ModelMetricsResponse(
        model_name="XGBoost Regressor (Primary)",
        evaluated_on="Out-of-sample Chronological Test Split (Latest 15% Time Window)",
        supported_commodities=list(SUPPORTED_COMMODITIES.keys()),
        supported_markets=list(JHARKHAND_MARKETS.keys()),
        overall_metrics=all_metrics,
        baseline_comparison=baseline_comp,
    )


@router.post("/price-predict", response_model=PricePredictResponse)
def predict_price(request: PricePredictRequest):
    """
    Generate 1, 3, or 7-day recursive regional price forecasts for Jharkhand markets.
    Returns expected prices, empirical prediction ranges, major explainability drivers,
    and a Sell Now vs Wait economic recommendation.
    """
    comm = request.commodity.strip().title()
    region = request.region.strip().title()

    if comm not in SUPPORTED_COMMODITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported commodity '{comm}'. Supported: {list(SUPPORTED_COMMODITIES.keys())}"
        )
    if region not in JHARKHAND_MARKETS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported Jharkhand region '{region}'. Supported: {list(JHARKHAND_MARKETS.keys())}"
        )

    registry, feature_df = get_registry_and_data()
    model = registry.get_model(comm)
    if not model:
        raise HTTPException(status_code=500, detail=f"Price model for '{comm}' is unavailable.")

    try:
        forecast_res = run_recursive_price_forecast(
            model=model,
            commodity=comm,
            region=region,
            historical_df=feature_df,
            forecast_days=request.forecast_days,
        )

        # Run economic Sell Now vs Wait evaluation
        optimizer = get_optimizer()
        farmer_loc = request.farmer_location or region
        dist_km = optimizer.calculate_transit_distance_km(farmer_loc, region)

        sell_wait_res = optimizer.evaluate_sell_now_vs_wait(
            commodity=comm,
            current_spot_price=forecast_res["current_price"],
            daily_predictions=forecast_res["predictions"],
            distance_km=dist_km,
            quantity_kg=request.quantity_kg or 1000.0,
        )

        pred_models = [DailyPriceForecast(**p) for p in forecast_res["predictions"]]

        return PricePredictResponse(
            commodity=comm,
            region=region,
            current_price=forecast_res["current_price"],
            forecast_days=request.forecast_days,
            model="XGBoost Regressor",
            predictions=pred_models,
            explainability_factors=forecast_res["explainability_factors"],
            recommendation=sell_wait_res["decision"],
            optimal_wait_days=sell_wait_res["optimal_wait_days"],
            expected_net_gain_per_kg=sell_wait_res["expected_net_gain_per_kg"],
            recommended_net_realization=sell_wait_res["recommended_net_realization"],
            decision_rationale=sell_wait_res["decision_rationale"],
            assumptions=forecast_res["assumptions"],
        )

    except Exception as exc:
        logger.error(f"Error executing price forecast: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Price prediction failed: {str(exc)}")


@router.post("/farmer-profit-recommendation", response_model=FarmerProfitRecommendationResponse)
def get_farmer_profit_recommendations(request: FarmerProfitRecommendationRequest):
    """
    Compare candidate Jharkhand markets to find the highest Expected Net Realization
    (Expected Price - Transport - Holding - Handling - Wastage).
    """
    comm = request.commodity.strip().title()
    if comm not in SUPPORTED_COMMODITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported commodity '{comm}'. Supported: {list(SUPPORTED_COMMODITIES.keys())}"
        )

    registry, feature_df = get_registry_and_data()
    model = registry.get_model(comm)
    if not model:
        raise HTTPException(status_code=500, detail=f"Model for '{comm}' is not loaded.")

    optimizer = get_optimizer()
    target_markets = request.candidate_markets or list(JHARKHAND_MARKETS.keys())

    # Get expected price for each candidate market
    market_prices: Dict[str, float] = {}
    for mkt in target_markets:
        mkt_title = mkt.strip().title()
        if mkt_title not in JHARKHAND_MARKETS:
            continue
        if request.current_price is not None:
            # Use provided override price
            market_prices[mkt_title] = float(request.current_price)
        else:
            # Forecast price for tomorrow (day 1)
            try:
                f_res = run_recursive_price_forecast(
                    model=model,
                    commodity=comm,
                    region=mkt_title,
                    historical_df=feature_df,
                    forecast_days=1,
                )
                market_prices[mkt_title] = f_res["predictions"][0]["predicted_price"]
            except Exception:
                # Fallback to latest slice price
                mkt_slice = feature_df[
                    (feature_df["commodity"] == comm) & (feature_df["region"] == mkt_title)
                ]
                latest_p = float(mkt_slice["modal_price"].iloc[-1]) if not mkt_slice.empty else 25.0
                market_prices[mkt_title] = latest_p

    comparison = optimizer.compare_markets(
        commodity=comm,
        quantity_kg=request.quantity_kg,
        farmer_location=request.farmer_location,
        market_predicted_prices=market_prices,
    )

    items = [MarketRecommendationItem(**c) for c in comparison]
    top_market = items[0].market if items else "Ranchi"
    max_net = items[0].expected_net_realization if items else 0.0

    return FarmerProfitRecommendationResponse(
        commodity=comm,
        quantity_kg=request.quantity_kg,
        farmer_location=request.farmer_location,
        recommendations=items,
        top_recommended_market=top_market,
        max_net_realization=max_net,
    )


@router.post("/market-allocation", response_model=MarketAllocationResponse)
def get_market_allocation(request: MarketAllocationRequest):
    """
    Calculate optimal multi-market quantity distribution to maximize farmer net realization
    while preventing supply oversaturation that depresses single-mandi prices.
    """
    comm = request.commodity.strip().title()
    registry, feature_df = get_registry_and_data()
    model = registry.get_model(comm)
    if not model:
        raise HTTPException(status_code=500, detail=f"Model for '{comm}' is not loaded.")

    optimizer = get_optimizer()

    # Get market prices
    market_prices: Dict[str, float] = {}
    for mkt in JHARKHAND_MARKETS.keys():
        try:
            f_res = run_recursive_price_forecast(
                model=model,
                commodity=comm,
                region=mkt,
                historical_df=feature_df,
                forecast_days=1,
            )
            market_prices[mkt] = f_res["predictions"][0]["predicted_price"]
        except Exception:
            market_prices[mkt] = 25.0

    comparison = optimizer.compare_markets(
        commodity=comm,
        quantity_kg=request.quantity_kg,
        farmer_location=request.farmer_location,
        market_predicted_prices=market_prices,
    )

    allocations = optimizer.allocate_market_supply(
        commodity=comm,
        total_quantity_kg=request.quantity_kg,
        market_options=comparison,
        max_single_market_share=request.max_single_market_share or 0.50,
    )

    items = [MarketAllocationItem(**a) for a in allocations]
    total_net_profit = sum(a["projected_net_revenue"] for a in allocations)

    return MarketAllocationResponse(
        commodity=comm,
        total_quantity_kg=request.quantity_kg,
        allocations=items,
        total_projected_net_profit=round(total_net_profit, 2),
    )
