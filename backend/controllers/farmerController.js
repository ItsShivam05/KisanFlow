const farmerService = require("../services/farmerService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

class FarmerController {
  async getDashboard(req, res, next) {
    try {
      const { id } = req.params;
      const data = await farmerService.getFarmerDashboard(id);
      if (!data) {
        return errorResponse(res, `Farmer '${id}' not found`, 404);
      }
      return successResponse(res, data, "Farmer dashboard data retrieved");
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req, res, next) {
    try {
      const { id } = req.params;
      const data = await farmerService.getFarmerInventory(id);
      return successResponse(res, data, "Farmer inventory retrieved");
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req, res, next) {
    try {
      const { id } = req.params;
      const data = await farmerService.getFarmerOrders(id);
      return successResponse(res, data, "Farmer incoming orders retrieved");
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const { id } = req.params;
      const data = await farmerService.getFarmerProfile(id);
      if (!data) {
        return errorResponse(res, `Farmer '${id}' not found`, 404);
      }
      return successResponse(res, data, "Farmer profile retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { id } = req.params;
      const data = await farmerService.updateFarmerProfile(id, req.body);
      if (!data) {
        return errorResponse(res, `Farmer '${id}' not found`, 404);
      }
      return successResponse(res, data, "Farmer profile updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FarmerController();
