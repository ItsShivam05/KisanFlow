const express = require("express");
const controller = require("../controllers/ai.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/forecast", authenticate, controller.getForecast);
router.get("/price-estimate", authenticate, controller.getPriceEstimate);
router.post("/pipeline", authenticate, controller.runPipeline);

module.exports = router;
