const { getHealthStatus } = require("../services/health.service");

function getHealth(_request, response) {
  response.status(200).json(getHealthStatus());
}

module.exports = { getHealth };
