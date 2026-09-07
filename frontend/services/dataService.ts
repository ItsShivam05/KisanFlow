import { apiClient } from "./api";
import { InventoryItem, Order, FarmerDashboardData } from "@/types/product";

export const dataService = {
  // Inventory Services
  async getInventory(filters?: { search?: string; category?: string; inStockOnly?: boolean }): Promise<InventoryItem[]> {
    const res = await apiClient.get<InventoryItem[]>("/inventory", {
      search: filters?.search,
      category: filters?.category,
      inStockOnly: filters?.inStockOnly ? "true" : undefined,
    });
    return res.data || [];
  },

  async getInventoryById(id: string): Promise<InventoryItem> {
    const res = await apiClient.get<InventoryItem>(`/inventory/${id}`);
    return res.data;
  },

  async createInventory(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await apiClient.post<InventoryItem>("/inventory", data);
    return res.data;
  },

  // Order Services
  async getOrders(filters?: { buyer_id?: string; status?: string }): Promise<Order[]> {
    const res = await apiClient.get<Order[]>("/orders", {
      buyer_id: filters?.buyer_id,
      status: filters?.status,
    });
    return res.data || [];
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await apiClient.get<Order>(`/orders/${id}`);
    return res.data;
  },

  async createOrder(data: {
    buyer_id: string;
    delivery_address: string;
    delivery_preference?: string;
    items: Array<{ inventory_id: string; quantity: number }>;
  }): Promise<Order> {
    const res = await apiClient.post<Order>("/orders", data);
    return res.data;
  },

  // Farmer Portal Services
  async getFarmerDashboard(farmerId: string): Promise<FarmerDashboardData> {
    const res = await apiClient.get<FarmerDashboardData>(`/farmers/${farmerId}/dashboard`);
    return res.data;
  },

  async getFarmerInventory(farmerId: string): Promise<InventoryItem[]> {
    const res = await apiClient.get<InventoryItem[]>(`/farmers/${farmerId}/inventory`);
    return res.data || [];
  },

  async getFarmerOrders(farmerId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/farmers/${farmerId}/orders`);
    return res.data || [];
  },
};
