const productService = require("../services/productService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

class ProductController {
  /**
   * GET /api/products
   */
  async getProducts(req, res, next) {
    try {
      const { search, category } = req.query;
      const products = await productService.getAllProducts({ search, category });
      return successResponse(res, products, "Products retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      if (!product) {
        return errorResponse(res, `Product with ID '${id}' not found`, 404);
      }

      return successResponse(res, product, "Product retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products
   */
  async createProduct(req, res, next) {
    try {
      const { name, category, description, unit } = req.body;
      const newProduct = await productService.createProduct({
        name,
        category,
        description,
        unit,
      });

      return successResponse(res, newProduct, "Product created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updatedProduct = await productService.updateProduct(id, req.body);

      if (!updatedProduct) {
        return errorResponse(res, `Product with ID '${id}' not found`, 404);
      }

      return successResponse(res, updatedProduct, "Product updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await productService.deleteProduct(id);

      if (!deleted) {
        return errorResponse(res, `Product with ID '${id}' not found`, 404);
      }

      return successResponse(res, { id }, "Product deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
