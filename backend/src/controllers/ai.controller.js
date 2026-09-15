const aiService = require("../services/ai.service");

async function getForecast(req, res, next) {
  try {
    const data = await aiService.getDemandForecast({
      product: req.query.product || "Tomato",
      region: req.query.region || "Patna",
      horizon_days: req.query.days || req.query.horizon_days || 7,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getPriceEstimate(req, res, next) {
  try {
    const data = await aiService.getPriceEstimate({
      product: req.query.product || "Tomato",
      region: req.query.region || "Patna",
      historical_baseline_price: req.query.baseline_price || 25,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function runPipeline(req, res, next) {
  try {
    const data = await aiService.runPipeline(req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getForecast,
  getPriceEstimate,
  runPipeline,
};
