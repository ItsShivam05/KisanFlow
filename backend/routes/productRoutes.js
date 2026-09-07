const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const {
  validateUUID,
  validateCreateProduct,
  validateUpdateProduct,
} = require("../validators/productValidator");

// GET /api/products - List all products (with optional ?search= & ?category=)
router.get("/", (req, res, next) => productController.getProducts(req, res, next));

// GET /api/products/:id - Get single product by UUID
router.get("/:id", validateUUID("id"), (req, res, next) => productController.getProductById(req, res, next));

// POST /api/products - Create a new product
router.post("/", validateCreateProduct, (req, res, next) => productController.createProduct(req, res, next));

// PUT /api/products/:id - Update product by UUID
router.put("/:id", validateUUID("id"), validateUpdateProduct, (req, res, next) => productController.updateProduct(req, res, next));

// DELETE /api/products/:id - Delete product by UUID
router.delete("/:id", validateUUID("id"), (req, res, next) => productController.deleteProduct(req, res, next));

module.exports = router;
