# KisanFlow AI & Optimization Architecture

```mermaid
flowchart TD
    subgraph Data Pipeline [Issue #7: Data Engineering]
        A[Agricultural Time-Series Data] --> B[Normalization & Cleaning]
        B --> C[Outlier Capping IQR]
        C --> D[Lag & Rolling Window Features]
        D --> E[Processed Feature Matrix]
    end

    subgraph Forecasting [Issue #8: ML Demand Forecaster]
        E --> F[Chronological Train/Val/Test Split]
        F --> G[XGBoost Regressor]
        G --> H[Multi-Day Recursive Inference Engine]
        H --> I[7-14 Day Demand Forecast]
    end

    subgraph Market Intelligence [Prototype Signal]
        J[Gemini / Calibrated Fallback] --> K[Current Market Spot Price]
        K --> L[Volatility Deviation Analysis]
    end

    subgraph Procurement [Issue #9: Matching Engine]
        I & M[Buyer Requirement 10,000 kg] --> N[Supplier Matching Engine]
        O[(Farmer & FPO Inventory)] --> N
        N --> P[Multi-Criteria Scoring]
        P --> Q[Iterative Greedy Allocation]
        Q --> R[Matched Suppliers & Pickups]
    end

    subgraph Logistics [Issue #10: Route Optimization]
        R --> S[Google OR-Tools CVRP Solver]
        T[Vehicle Capacity Constraints] --> S
        U[Haversine Road Distance Matrix] --> S
        S --> V[Optimized Multi-Stop Routes]
        V --> W[Savings vs Traditional Baseline]
    end

    subgraph API Layer [FastAPI Application]
        I -.-> X[/forecast]
        L -.-> Y[/price-estimate]
        Q -.-> Z[/match-suppliers]
        V -.-> AA[/optimize-route]
        W -.-> AB[/pipeline/run]
    end
```

## Architectural Boundaries
1. **Numerical Demand Forecasting**: Driven strictly by Machine Learning (`XGBoost`). LLMs are strictly excluded from numerical forecasting.
2. **Supplier Matching & Allocation**: Driven strictly by deterministic weighted rules and greedy linear allocation. LLMs are strictly excluded from scoring or ranking.
3. **Route Optimization**: Driven strictly by Google OR-Tools constraint programming (CVRP). LLMs are strictly excluded from route solving.
4. **Market Price Intelligence**: Gemini is used exclusively as an experimental prototype estimator, strictly isolated with deterministic fallbacks and explicit simulated labels.
