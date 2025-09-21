// ---------- Menu ----------
export interface AppMenuItem {
  id: number;
  name: string;
  price: number;
  available: boolean;
  image_url?: string;
  created_at?: string; // keep optional for Dexie/local
  updated_at?: string;
}

// ---------- Orders ----------
export interface OrderItem {
  id?: number;           // DB id
  order_id?: number;     // reference to order
  menu_item_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  source: "pos" | "kiosk" | "online";
  status: "pending" | "preparing" | "ready" | "completed";
  created_at: string;
  updated_at: string;
}

export interface OrderItemDetailed extends OrderItem {
  menu_name: string;
  menu_price: number;
  menu_image?: string | null;
}

export interface OrderDetailed {
  order: Order;
  items: OrderItemDetailed[];
}

// ---------- Queue ----------
export interface QueueToken {
  id: number;
  order_id: number;
  token_number: number;
  status: "waiting" | "ready";
  created_at: string;
}

// ---------- Local Offline Order ----------
export interface LocalOrder {
  id?: number;
  source: "pos" | "kiosk";
  status: "pending" | "preparing" | "ready" | "completed";
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  synced: 0 | 1;
}

// ---------- Cart ----------
export interface CartItem extends AppMenuItem {
  quantity: number;
}

// ---------- Receipt ----------
export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptPayload {
  order_id: number;
  items: ReceiptItem[];
  total: number;
}
