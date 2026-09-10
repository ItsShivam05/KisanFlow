const { User } = require("../models/user.model");
const { verifyAccessToken } = require("../services/token.service");

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function authenticate(request, _response, next) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw createHttpError("Authentication token is required", 401);

    const payload = verifyAccessToken(authorization.slice(7));
    const user = await User.findById(payload.sub);
    if (!user) throw createHttpError("User account was not found", 401);

    request.user = user;
    next();
  } catch (error) {
    next(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" ? createHttpError("Invalid or expired token", 401) : error);
  }
}

function authorizeRoles(...allowedRoles) {
  return (request, _response, next) => {
    if (!allowedRoles.includes(request.user.role)) return next(createHttpError("You are not authorized for this action", 403));
    next();
  };
}

module.exports = { authenticate, authorizeRoles };
