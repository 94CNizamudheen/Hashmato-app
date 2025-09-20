import { useEffect, useState } from "react";
import { api } from "../../../apps/shared/src/api";
import type { Order } from '../../../apps/shared/src/types'

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchOrders() {
    try {
      const res = await api.get<Order[]>("/kds/orders");
      setOrders(res.data);
    } catch (e) {
      console.error("Failed to fetch KDS orders", e);
    }
  }

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 5000); // poll every 5s
    return () => clearInterval(id);
  }, []);

  async function updateOrderStatus(orderId: number, status: string) {
    setLoading(true);
    try {
      await api.put(`/orders/${orderId}`, { status });
      await fetchOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>KDS — Kitchen Display</h1>
      <div>
        {orders.map(o => (
          <div key={o.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8 }}>
            <div><strong>Order #{o.id}</strong> — {o.source} — {o.status}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => updateOrderStatus(o.id, "preparing")} disabled={loading}>Preparing</button>
              <button onClick={() => updateOrderStatus(o.id, "ready")} disabled={loading}>Ready</button>
              <button onClick={() => updateOrderStatus(o.id, "completed")} disabled={loading}>Complete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
