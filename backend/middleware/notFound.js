const { errorResponse } = require("../utils/apiResponse");

const notFound = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = notFound;
