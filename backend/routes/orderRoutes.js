const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { validateUUID } = require("../validators/productValidator");

router.get("/", (req, res, next) => orderController.getOrders(req, res, next));
router.get("/:id", validateUUID("id"), (req, res, next) => orderController.getOrderById(req, res, next));
router.post("/", (req, res, next) => orderController.createOrder(req, res, next));
router.put("/:id/status", validateUUID("id"), (req, res, next) => orderController.updateOrderStatus(req, res, next));

module.exports = router;
