import { useEffect, useState } from "react";
import MenuCard from "../components/MenuCard";
import * as api from "../services/api";
import { db } from "../db/dexie";
import { AppMenuItem, CartItem, LocalOrder } from "../types";

export default function KioskPage() {
  const [menu, setMenu] = useState<AppMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderPlaced, setOrderPlaced] = useState<LocalOrder | null>(null);
  const [queueNumber, setQueueNumber] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

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
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      found.quantity++;
      setCart([...cart]);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  }

  async function placeOrder() {
    if (cart.length === 0) return;

    const localOrder: LocalOrder = {
      source: "kiosk",
      status: "pending" as const,
      items: cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity })),
      synced: 0,
      created_at: new Date().toISOString(),
    };

    const localId = await db.orders.add(localOrder);

    try {
      const res = await api.createOrder({ source: "kiosk", items: localOrder.items });
      await db.orders.update(localId, { synced: 1 });

      // ✅ Use backend order ID as queue number
      setQueueNumber(res.id?.toString() || res.order_id?.toString() || `#${localId}`);
    } catch (e) {
      console.warn("queued for sync", e);

      // ❌ fallback to local ID if offline
      setQueueNumber(`#${localId}`);
    }

    setOrderPlaced(localOrder);
    setCart([]);
  }

  function getTotal() {
    return cart.reduce((sum, c) => sum + c.price * c.quantity, 0).toFixed(2);
  }

  return (
    <div className="p-6">
      {!orderPlaced ? (
        <div className="grid grid-cols-4 gap-6">
          {/* Menu Grid */}
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {menu.map((m) => (
              <MenuCard key={m.id} item={m} onAdd={add} />
            ))}
          </div>

          {/* Cart */}
          <div className="col-span-1 bg-white rounded-xl shadow-lg p-4 flex flex-col">
            <h3 className="font-bold text-lg border-b pb-2 mb-3">Your Cart</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between text-sm border-b pb-1"
                >
                  <span>
                    {c.name} x{c.quantity}
                  </span>
                  <span>₹{(c.price * c.quantity).toFixed(2)}</span>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-slate-400 text-center mt-6">Cart is empty</p>
              )}
            </div>
            {cart.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{getTotal()}</span>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full mt-3 bg-blue-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ✅ Order Confirmation Screen
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <h2 className="text-2xl font-bold text-green-600">✅ Order Placed</h2>
          <p className="text-slate-600 mt-2">Please wait for your order</p>
          <div className="mt-6 bg-white shadow-xl rounded-2xl p-8 w-96">
            <p className="text-sm text-slate-500">Your Queue Number</p>
            <h1 className="text-5xl font-extrabold text-blue-600 mt-2">
              {queueNumber}
            </h1>
            <ul className="mt-6 space-y-2 text-left">
              {orderPlaced.items.map((it, idx) => {
                const menuItem = menu.find((m) => m.id === it.menu_item_id);
                return (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {menuItem?.name} x{it.quantity}
                    </span>
                    <span>₹{(menuItem?.price || 0) * it.quantity}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            onClick={() => setOrderPlaced(null)}
            className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
