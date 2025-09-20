import { useEffect, useState } from "react";
import MenuCard from "../components/MenuCard";
import * as api from "../services/api";
import { db } from "../db/dexie";
import { AppMenuItem, CartItem, LocalOrder } from "../types";

export default function KioskPage() {
  const [menu, setMenu] = useState<AppMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const local = await db.menu.toArray();
    if (local.length > 0) setMenu(local);
    try {
      const remote = await api.fetchMenu();
      setMenu(remote);
      for (const it of remote) {
        await db.menu.put({
          id: it.id,
          name: it.name,
          price: Number(it.price),
          available: it.available,
          image_url: it.image_url,
          updated_at: it.updated_at,
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  function add(item: AppMenuItem) {
    const found = cart.find(c => c.id === item.id);
    if (found) {
      found.quantity++;
      setCart([...cart]);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  }

  async function placeOrder() {
    const localOrder:LocalOrder = {
      source: "kiosk",
      status: "pending" as const,
      items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
      synced: 0,
      created_at: new Date().toISOString(),
    };
    const id = await db.orders.add(localOrder);
    try {
      await api.createOrder({ source: "kiosk", items: localOrder.items });
      await db.orders.update(id, { synced: 1 });
    } catch (e) {
      console.warn("queued for sync", e);
    }
    setCart([]);
    alert("Order submitted — token will be displayed soon");
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {menu.map(m => <MenuCard key={m.id} item={m} onAdd={add} />)}
      <div className="col-span-1">
        <h3 className="font-bold">Cart</h3>
        {cart.map(c => (
          <div key={c.id}>
            {c.name} x{c.quantity}
          </div>
        ))}
        <button
          onClick={placeOrder}
          className="mt-3 bg-blue-600 text-white py-2 px-4 rounded"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
