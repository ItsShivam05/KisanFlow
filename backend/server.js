const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const apiRoutes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KisanFlow Backend is running 🚜",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Mount Central API Routes
app.use("/api", apiRoutes);

// 404 Route Handler
app.use(notFound);

// Central Global Error Handler
app.use(errorHandler);

// Server initialization
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🌾 KisanFlow Backend running on http://localhost:${PORT}`);
  try {
    const res = await db.query("SELECT NOW();");
    console.log("🐘 Neon Database connection verified at:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed on startup:", err.message);
  }
});

module.exports = app;