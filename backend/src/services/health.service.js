function getHealthStatus() {
  return {
    success: true,
    message: "KisanFlow API is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    }
  };
}

module.exports = { getHealthStatus };
