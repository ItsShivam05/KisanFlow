const express = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("./auth.routes");

const apiRouter = express.Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);

module.exports = { apiRouter };
