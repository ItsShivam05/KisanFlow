const { errorResponse } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  // Default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // PostgreSQL specific error handling
  if (err.code) {
    // 22P02: Invalid text representation (e.g. invalid UUID format)
    if (err.code === "22P02") {
      statusCode = 400;
      message = "Invalid identifier format";
    }
    // 23505: Unique violation
    else if (err.code === "23505") {
      statusCode = 409;
      message = "Resource already exists";
    }
    // 23503: Foreign key violation
    else if (err.code === "23503") {
      statusCode = 400;
      message = "Referenced resource does not exist";
    }
    // Generic database error - do not leak raw query / db internals
    else {
      statusCode = 500;
      message = "A database operation error occurred";
    }
  }

  // Ensure internal stack traces and secrets are not leaked in response
  return errorResponse(res, message, statusCode);
};

module.exports = errorHandler;
