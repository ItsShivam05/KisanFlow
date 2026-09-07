const inventoryService = require("../services/inventoryService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

class InventoryController {
  async getInventory(req, res, next) {
    try {
      const { search, category, inStockOnly } = req.query;
      const items = await inventoryService.getAllInventory({
        search,
        category,
        inStockOnly: inStockOnly === "true",
      });
      return successResponse(res, items, "Inventory fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getInventoryById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await inventoryService.getInventoryById(id);
      if (!item) {
        return errorResponse(res, `Inventory item with ID '${id}' not found`, 404);
      }
      return successResponse(res, item, "Inventory batch retrieved");
    } catch (error) {
      next(error);
    }
  }

  async createInventory(req, res, next) {
    try {
      const { product_id, farmer_id, fpo_id, quantity, available_quantity, price_per_unit, quality, harvest_date, available_from, available_until } = req.body;
      if (!product_id || !quantity || !price_per_unit) {
        return errorResponse(res, "product_id, quantity, and price_per_unit are required", 400);
      }
      const newItem = await inventoryService.createInventory({
        product_id,
        farmer_id,
        fpo_id,
        quantity,
        available_quantity,
        price_per_unit,
        quality,
        harvest_date,
        available_from,
        available_until,
      });
      return successResponse(res, newItem, "Inventory lot created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateInventory(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await inventoryService.updateInventory(id, req.body);
      if (!updated) {
        return errorResponse(res, `Inventory lot with ID '${id}' not found`, 404);
      }
      return successResponse(res, updated, "Inventory updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteInventory(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await inventoryService.deleteInventory(id);
      if (!deleted) {
        return errorResponse(res, `Inventory lot with ID '${id}' not found`, 404);
      }
      return successResponse(res, { id }, "Inventory deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
