const express = require("express");
const cors = require("cors");
const { apiRouter } = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/error-handler");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
