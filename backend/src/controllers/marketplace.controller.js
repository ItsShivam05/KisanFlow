const service = require("../services/marketplace.service");

function run(handler) {
  return async (request, response, next) => {
    try {
      response
        .status(200)
        .json({ success: true, data: await handler(request) });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  getFarmer: run((request) => service.getFarmer(request.user)),
  saveFarmer: run((request) => service.saveFarmer(request.user, request.body)),
  getBuyer: run((request) => service.getBuyer(request.user)),
  saveBuyer: run((request) => service.saveBuyer(request.user, request.body)),
  listInventory: run((request) =>
    service.listInventory(request.user, request.query),
  ),
  createInventory: run((request) =>
    service.createInventory(request.user, request.body),
  ),
  getInventoryItem: run((request) =>
    service.getInventoryItem(request.user, request.params.id),
  ),
  createProcurement: run((request) =>
    service.createProcurement(request.user, request.body),
  ),
  listProcurement: run((request) => service.listProcurement(request.user)),
  getProcurement: run((request) =>
    service.getProcurement(request.user, request.params.id),
  ),
  matchProcurement: run((request) =>
    service.matchProcurement(request.user, request.params.id),
  ),
  optimizeAllocation: run((request) =>
    service.optimizeAllocation(request.user, request.params.id),
  ),
  confirmProcurement: run((request) =>
    service.confirmProcurement(request.user, request.params.id),
  ),
  listOrders: run((request) => service.listOrders(request.user)),
  updateDelivery: run((request) =>
    service.updateDelivery(
      request.user,
      request.params.id,
      request.body.status,
      request.body.exception_reason,
    ),
  ),
  optimizeProcurement: run((request) =>
    service.optimizeProcurement(request.user, request.params.id),
  ),
  getImpact: run((request) => service.getImpact(request.user)),
};
