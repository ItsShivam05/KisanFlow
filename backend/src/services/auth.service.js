const bcrypt = require("bcryptjs");
const { User, UserRole } = require("../models/user.model");
const { signAccessToken } = require("./token.service");

const roles = new Set(Object.values(UserRole));

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function registerUser({ name, email, password, role = UserRole.CONSUMER }) {
  if (!name || !email || !password) throw createHttpError("Name, email, and password are required", 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw createHttpError("A valid email is required", 400);
  if (password.length < 8) throw createHttpError("Password must be at least 8 characters", 400);
  if (!roles.has(role)) throw createHttpError("Invalid user role", 400);
  if (role === UserRole.ADMIN) throw createHttpError("Admin accounts cannot be self-registered", 403);
  if (await User.findByEmail(email)) throw createHttpError("An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.trim(), passwordHash, role });
  return { user: user.toSafeObject(), token: signAccessToken(user) };
}

async function loginUser({ email, password }) {
  if (!email || !password) throw createHttpError("Email and password are required", 400);
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createHttpError("Invalid email or password", 401);
  }
  return { user: user.toSafeObject(), token: signAccessToken(user) };
}

module.exports = { registerUser, loginUser, createHttpError };
