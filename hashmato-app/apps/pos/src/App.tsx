import { useEffect, useState } from "react";
import { api } from '../../../apps/shared/src/api'
import type { MenuItem, CreateOrder, CreateOrderItem } from '../../../apps/shared/src/types'

export default function App() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CreateOrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<MenuItem[]>("/menu")
      .then(res => setMenu(res.data))
      .catch(err => console.error("Menu fetch error", err));
  }, []);

  function addToCart(itemId: number) {
    setCart(prev => {
      const found = prev.find(p => p.menu_item_id === itemId);
      if (found) return prev.map(p => p.menu_item_id === itemId ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { menu_item_id: itemId, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: number) {
    setCart(prev => prev.filter(p => p.menu_item_id !== itemId));
  }

  async function placeOrder() {
    if (cart.length === 0) return alert("Cart empty");
    setLoading(true);
    const payload: CreateOrder = { source: "POS", items: cart };
    try {
      const res = await api.post("/orders", payload);
      alert(`Order created: ${res.data.order_id}`);
      setCart([]);
    } catch (e) {
      console.error(e);
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>POS — Hashmato</h1>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h2>Menu</h2>
          <div>
            {menu.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <div>
                  <strong>{m.name}</strong><br />
                  ${typeof m.price === "string" ? parseFloat(m.price).toFixed(2) : (m.price as number).toFixed(2)}
                </div>
                <div>
                  <button onClick={() => addToCart(m.id)}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 320 }}>
          <h2>Cart</h2>
          {cart.length === 0 && <div>Empty</div>}
          {cart.map(ci => {
            const mi = menu.find(m => m.id === ci.menu_item_id);
            return (
              <div key={ci.menu_item_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <div>{mi?.name} x {ci.quantity}</div>
                <div>
                  <button onClick={() => setCart(prev => prev.map(p => p.menu_item_id === ci.menu_item_id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p))}>-</button>
                  <button onClick={() => setCart(prev => prev.map(p => p.menu_item_id === ci.menu_item_id ? { ...p, quantity: p.quantity + 1 } : p))}>+</button>
                  <button onClick={() => removeFromCart(ci.menu_item_id)}>Remove</button>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 12 }}>
            <button onClick={placeOrder} disabled={loading}>{loading ? "Placing..." : "Place Order"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
