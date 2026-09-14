const express = require("express");
const controller = require("../controllers/marketplace.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate);
router.get("/farmers/me", controller.getFarmer);
router.post("/farmers/me", controller.saveFarmer);
router.patch("/farmers/me", controller.saveFarmer);
router.get("/buyers/me", controller.getBuyer);
router.post("/buyers/me", controller.saveBuyer);
router.patch("/buyers/me", controller.saveBuyer);
router.get("/inventory/search", controller.listInventory);
router.get("/inventory", controller.listInventory);
router.post("/inventory", controller.createInventory);
router.get("/inventory/:id", controller.getInventoryItem);
router.post("/procurement-requests", controller.createProcurement);
router.get("/procurement-requests", controller.listProcurement);
router.get("/procurement-requests/:id", controller.getProcurement);
router.post("/procurement-requests/:id/match", controller.matchProcurement);
router.post("/procurement-requests/:id/confirm", controller.confirmProcurement);
router.post(
  "/procurement-requests/:id/optimize-route",
  controller.optimizeProcurement,
);
router.get("/orders", controller.listOrders);
router.patch("/orders/:id/delivery", controller.updateDelivery);
router.get("/impact", controller.getImpact);
module.exports = router;
