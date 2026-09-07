const { errorResponse } = require("../utils/apiResponse");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateUUID = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse(res, `Invalid ${paramName} format. Must be a valid UUID.`, 400);
    }
    next();
  };
};

const validateCreateProduct = (req, res, next) => {
  const { name, category, description, unit } = req.body;
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Product 'name' is required and must be a non-empty string.");
  } else if (name.trim().length > 255) {
    errors.push("Product 'name' cannot exceed 255 characters.");
  }

  if (category !== undefined && category !== null) {
    if (typeof category !== "string" || category.trim().length > 100) {
      errors.push("Product 'category' must be a string up to 100 characters.");
    }
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    errors.push("Product 'description' must be text.");
  }

  if (unit !== undefined && unit !== null) {
    if (typeof unit !== "string" || unit.trim().length > 50) {
      errors.push("Product 'unit' must be a string up to 50 characters (e.g. 'kg', 'quintal', 'crate').");
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", 400, errors);
  }

  next();
};

const validateUpdateProduct = (req, res, next) => {
  const { name, category, description, unit } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.push("Product 'name' must be a non-empty string.");
    } else if (name.trim().length > 255) {
      errors.push("Product 'name' cannot exceed 255 characters.");
    }
  }

  if (category !== undefined && category !== null) {
    if (typeof category !== "string" || category.trim().length > 100) {
      errors.push("Product 'category' must be a string up to 100 characters.");
    }
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    errors.push("Product 'description' must be text.");
  }

  if (unit !== undefined && unit !== null) {
    if (typeof unit !== "string" || unit.trim().length > 50) {
      errors.push("Product 'unit' must be a string up to 50 characters.");
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", 400, errors);
  }

  next();
};

module.exports = {
  validateUUID,
  validateCreateProduct,
  validateUpdateProduct,
};
