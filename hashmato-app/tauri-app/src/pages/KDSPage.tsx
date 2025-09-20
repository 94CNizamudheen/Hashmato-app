import  { useEffect, useState } from "react";
import * as api from "../services/api";
import { connectWS, onQueueUpdate } from "../services/ws";
import { OrderDetailed } from "../types";

export default function KDSPage() {
  const [orders, setOrders] = useState<OrderDetailed[]>([]);

  useEffect(() => {
    load();
    connectWS();
    const off = onQueueUpdate(() => {
      load();
    });
    return off;
  }, []);

  async function load() {
    const res: OrderDetailed[] = await api.listOrdersDetailed();
    setOrders(res);
  }

  async function markReady(orderId: number) {
    await api.updateOrderStatus(orderId, "ready");
    load();
  }

  async function complete(orderId: number) {
    await api.updateOrderStatus(orderId, "completed");
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Kitchen Display</h2>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((o) => (
          <div key={o.order.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-bold">Order #{o.order.id}</div>
                <div className="text-sm text-gray-500">
                  {o.order.source} • {o.order.status}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markReady(o.order.id)}
                  className="px-3 py-1 bg-yellow-400 rounded"
                >
                  Ready
                </button>
                <button
                  onClick={() => complete(o.order.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Complete
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {o.items.map((it) => (
                <div key={it.id} className="p-2 border rounded">
                  <div className="font-semibold">{it.menu_name}</div>
                  <div className="text-sm text-gray-500">x{it.quantity}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
