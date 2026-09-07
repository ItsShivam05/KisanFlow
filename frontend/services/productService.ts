import { apiClient } from "./api";
import { Product, ProductFilters } from "@/types/product";

export const productService = {
  /**
   * Fetch all products from backend
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const response = await apiClient.get<Product[]>("/products", {
      search: filters?.search,
      category: filters?.category,
    });
    return response.data || [];
  },

  /**
   * Fetch single product by UUID
   */
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  async createProduct(data: {
    name: string;
    category?: string;
    description?: string;
    unit?: string;
  }): Promise<Product> {
    const response = await apiClient.post<Product>("/products", data);
    return response.data;
  },

  /**
   * Update product by UUID
   */
  async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      description: string;
      unit: string;
    }>
  ): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete product by UUID
   */
  async deleteProduct(id: string): Promise<{ id: string }> {
    const response = await apiClient.delete<{ id: string }>(`/products/${id}`);
    return response.data;
  },
};
