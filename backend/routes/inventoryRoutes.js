const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { validateUUID } = require("../validators/productValidator");

router.get("/", (req, res, next) => inventoryController.getInventory(req, res, next));
router.get("/:id", validateUUID("id"), (req, res, next) => inventoryController.getInventoryById(req, res, next));
router.post("/", (req, res, next) => inventoryController.createInventory(req, res, next));
router.put("/:id", validateUUID("id"), (req, res, next) => inventoryController.updateInventory(req, res, next));
router.delete("/:id", validateUUID("id"), (req, res, next) => inventoryController.deleteInventory(req, res, next));

module.exports = router;
