export interface MenuItem {
  id: number;
  name: string;
  price: number | string; 
  available: boolean;
}

export interface CreateOrderItem {
  menu_item_id: number;
  quantity: number;
}

export interface CreateOrder {
  source: "POS" | "KIOSK";
  items: CreateOrderItem[];
}

export interface Order {
  id: number;
  source: string;
  status: string;
  created_at?: string;
}

export interface QueueToken {
  id: number;
  order_id: number;
  token_number: number;
  status: string;
}
