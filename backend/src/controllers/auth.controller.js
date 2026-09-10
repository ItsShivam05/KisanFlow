const { registerUser, loginUser } = require("../services/auth.service");

async function register(request, response, next) {
  try {
    const result = await registerUser(request.body);
    response.status(201).json({ success: true, message: "User registered successfully", data: result });
  } catch (error) { next(error); }
}

async function login(request, response, next) {
  try {
    const result = await loginUser(request.body);
    response.status(200).json({ success: true, message: "Login successful", data: result });
  } catch (error) { next(error); }
}

function getMe(request, response) {
  response.status(200).json({ success: true, data: { user: request.user.toSafeObject() } });
}

function adminExample(_request, response) {
  response.status(200).json({ success: true, message: "Admin-only route accessed" });
}

module.exports = { register, login, getMe, adminExample };
