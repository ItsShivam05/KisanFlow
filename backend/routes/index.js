const express = require("express");
const router = express.Router();
const productRoutes = require("./productRoutes");
const inventoryRoutes = require("./inventoryRoutes");
const orderRoutes = require("./orderRoutes");
const farmerRoutes = require("./farmerRoutes");

// Health check endpoint
router.get("/health", async (req, res, next) => {
  try {
    const db = require("../config/db");
    const result = await db.query("SELECT NOW() as current_time, current_database() as database;");
    res.json({
      success: true,
      status: "healthy",
      message: "KisanFlow Backend & Neon PostgreSQL are operational",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Mounted API Routes
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/orders", orderRoutes);
router.use("/farmers", farmerRoutes);

module.exports = router;
