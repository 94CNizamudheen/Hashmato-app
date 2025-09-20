import  { useEffect, useState } from "react";
import { api } from "../../../apps/shared/src/api";
import type { MenuItem, CreateOrder, CreateOrderItem, Order } from "../../../apps/shared/src/types";

export default function App() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CreateOrderItem[]>([]);
  const [orderResult, setOrderResult] = useState<Order | null>(null);

  useEffect(() => {
    api.get<MenuItem[]>("/menu")
      .then(res => setMenu(res.data))
      .catch(err => console.error(err));
  }, []);

  function addToCart(menuId: number) {
    setCart(prev => {
      const found = prev.find(p => p.menu_item_id === menuId);
      if (found) return prev.map(p => p.menu_item_id === menuId ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { menu_item_id: menuId, quantity: 1 }];
    });
  }

  async function checkout() {
    if (!cart.length) return;
    const payload: CreateOrder = { source: "KIOSK", items: cart };
    try {
      const res = await api.post("/orders", payload);
      setOrderResult(res.data);
      setCart([]);
    } catch (e) {
      console.error(e);
      alert("Failed to create order");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Kiosk — Hashmato</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {menu.map(m => (
          <div key={m.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <h3>{m.name}</h3>
            <div>${typeof m.price === "string" ? parseFloat(m.price).toFixed(2) : (m.price as number).toFixed(2)}</div>
            <button style={{ marginTop: 8 }} onClick={() => addToCart(m.id)}>Add</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Cart</h3>
        {cart.map(c => <div key={c.menu_item_id}>{c.menu_item_id} × {c.quantity}</div>)}
        <button onClick={checkout}>Place Order</button>
      </div>

      {orderResult && (
        <div style={{ marginTop: 20, padding: 12, border: "1px solid green" }}>
          <strong>Order placed!</strong>
          <div>Order ID: {orderResult.id}</div>
          <div>Status: {orderResult.status}</div>
        </div>
      )}
    </div>
  );
}
