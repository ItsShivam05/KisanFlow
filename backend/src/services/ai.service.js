const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function callAiService(endpoint, body, method = "POST") {
  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.statusText} (${errorText})`);
    }
    return await response.json();
  } catch (error) {
    console.error(`AI service call to ${endpoint} failed:`, error.message);
    throw createHttpError(
      "AI insights are temporarily unavailable. Ensure the AI service is running at " + AI_SERVICE_URL,
      503
    );
  }
}

async function getDemandForecast({ product = "Tomato", region = "Patna", horizon_days = 7 }) {
  return callAiService("/forecast", {
    product,
    region,
    horizon_days: Number(horizon_days) || 7,
  });
}

async function getPriceEstimate({ product = "Tomato", region = "Patna", historical_baseline_price = 25 }) {
  return callAiService("/price-estimate", {
    commodity: product,
    region,
    historical_baseline_price: Number(historical_baseline_price) || 25,
  });
}

async function optimizeAllocation(payload) {
  return callAiService("/optimize-allocation", payload);
}

async function runPipeline(payload) {
  return callAiService("/pipeline/run", payload);
}

module.exports = {
  getDemandForecast,
  getPriceEstimate,
  optimizeAllocation,
  runPipeline,
};
