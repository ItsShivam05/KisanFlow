export interface Product {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  unit: string;
  price_per_unit?: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  farmer_id: string | null;
  fpo_id: string | null;
  quantity: number | string;
  available_quantity: number | string;
  price_per_unit: number | string;
  quality: string | null;
  harvest_date: string | null;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  product_name?: string;
  category?: string;
  unit?: string;
  farmer_name?: string;
  fpo_name?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  inventory_id: string;
  product_id: string;
  quantity: number | string;
  price_per_unit: number | string;
  subtotal: number | string;
  product_name?: string;
  category?: string;
  unit?: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  order_status: "pending" | "confirmed" | "processing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  delivery_address: string;
  delivery_preference?: string;
  total_amount: number | string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  buyer_name?: string;
  items?: OrderItem[];
}

export interface FarmerMetrics {
  totalLots: number;
  totalAvailableQty: number;
  totalStockValue: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  totalEarnings: number;
}

export interface FarmerDashboardData {
  farmer: {
    id: string;
    profile_id: string;
    farm_name: string;
    farm_size_acres: number;
    address: string;
    verification_status: string;
    full_name: string;
    phone: string;
    role: string;
  };
  metrics: FarmerMetrics;
  recentOrders: Array<{
    order_id: string;
    order_status: string;
    created_at: string;
    product_name: string;
    quantity: number | string;
    unit: string;
    subtotal: number | string;
    buyer_business: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface ProductFilters {
  search?: string;
  category?: string;
}
