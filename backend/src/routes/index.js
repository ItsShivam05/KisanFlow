const express = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("./auth.routes");
const aiRouter = require("./ai.routes");
const marketplaceRouter = require("./marketplace.routes");

const apiRouter = express.Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/", marketplaceRouter);

module.exports = { apiRouter };
