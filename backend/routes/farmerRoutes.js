const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");
const { validateUUID } = require("../validators/productValidator");

// GET /api/farmers/:id/dashboard
router.get("/:id/dashboard", validateUUID("id"), (req, res, next) =>
  farmerController.getDashboard(req, res, next)
);

// GET /api/farmers/:id/inventory
router.get("/:id/inventory", validateUUID("id"), (req, res, next) =>
  farmerController.getInventory(req, res, next)
);

// GET /api/farmers/:id/orders
router.get("/:id/orders", validateUUID("id"), (req, res, next) =>
  farmerController.getOrders(req, res, next)
);

// GET /api/farmers/:id/profile
router.get("/:id/profile", validateUUID("id"), (req, res, next) =>
  farmerController.getProfile(req, res, next)
);

// PUT /api/farmers/:id/profile
router.put("/:id/profile", validateUUID("id"), (req, res, next) =>
  farmerController.updateProfile(req, res, next)
);

module.exports = router;
