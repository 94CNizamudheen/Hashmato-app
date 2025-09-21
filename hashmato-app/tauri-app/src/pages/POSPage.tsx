import { useEffect, useState } from "react";
import MenuCard from "../components/MenuCard";
import CartSidebar from "../components/CartSidebar";
import * as api from "../services/api";
import { db } from "../db/dexie";
import { AppMenuItem, CartItem, LocalOrder } from "../types";

export default function POSPage() {
  const [menu, setMenu] = useState<AppMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const local = await db.menu.toArray();
    console.log("local items", local);
    if (local.length > 0) setMenu(local);

    try {
      const remote = await api.fetchMenu();
      console.log("remote items", remote);
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
    setCart((prev) => {
      const found = prev.find((c) => c.id === item.id);
      if (found) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        return [...prev, { ...item, quantity: 1, price: Number(item.price) }];
      }
    });
  }

  async function onCheckout() {
    const localOrder: LocalOrder = {
      source: "pos",
      status: "pending",
      items: cart.map((c) => ({
        menu_item_id: c.id,
        quantity: c.quantity,
      })),
      synced: 0,
      created_at: new Date().toISOString(),
    };

    const id = await db.orders.add(localOrder);

    try {
      await api.createOrder({ source: "pos", items: localOrder.items });
      localOrder.synced = 1;
      await db.orders.put({ ...localOrder, id });
    } catch (e) {
      console.warn("order queued for sync", e);
    }

    setCart([]);
    alert("Order placed");
  }

  return (
    <div className="flex gap-4">
      <div className="grid grid-cols-3 gap-4 flex-1">
        {menu.map((m) => (
          <MenuCard key={m.id} item={m} onAdd={add} />
        ))}
      </div>
      <CartSidebar cart={cart} setCart={setCart} onCheckout={onCheckout} />
    </div>
  );
}
