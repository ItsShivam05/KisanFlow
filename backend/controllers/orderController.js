const orderService = require("../services/orderService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

class OrderController {
  async getOrders(req, res, next) {
    try {
      const { buyer_id, status } = req.query;
      const orders = await orderService.getAllOrders({ buyer_id, status });
      return successResponse(res, orders, "Orders retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      if (!order) {
        return errorResponse(res, `Order '${id}' not found`, 404);
      }
      return successResponse(res, order, "Order retrieved");
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const { buyer_id, delivery_address, delivery_preference, items } = req.body;
      const order = await orderService.createOrder({
        buyer_id,
        delivery_address,
        delivery_preference,
        items,
      });
      return successResponse(res, order, "Order created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { order_status, payment_status } = req.body;
      const updated = await orderService.updateOrderStatus(id, { order_status, payment_status });
      if (!updated) {
        return errorResponse(res, `Order '${id}' not found`, 404);
      }
      return successResponse(res, updated, "Order status updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
