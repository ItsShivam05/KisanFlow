const express = require("express");
const { register, login, getMe, adminExample } = require("../controllers/auth.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { UserRole } = require("../models/user.model");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/admin-example", authenticate, authorizeRoles(UserRole.ADMIN), adminExample);

module.exports = router;
