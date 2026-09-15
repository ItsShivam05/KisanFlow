const express = require("express");
const cors = require("cors");
const { apiRouter } = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/error-handler");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KisanFlow API is running",
    service: "backend",
    version: "1.0.0",
  });
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
