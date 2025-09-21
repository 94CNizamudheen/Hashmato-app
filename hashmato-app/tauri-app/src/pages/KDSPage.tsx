import { useEffect, useState } from "react";
import * as api from "../services/api";
import { connectWS, onQueueUpdate } from "../services/ws";
import { OrderDetailed } from "../types";

export default function KDSPage() {
  const [orders, setOrders] = useState<OrderDetailed[]>([]);
  const [loadingOrder, setLoadingOrder] = useState<{ id: number; action: "ready" | "completed" } | null>(null);

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
    setLoadingOrder({ id: orderId, action: "ready" });
    try {
      await api.updateOrderStatus(orderId, "ready");
      await load();
    } finally {
      setLoadingOrder(null);
    }
  }

  async function complete(orderId: number) {
    setLoadingOrder({ id: orderId, action: "completed" });
    try {
      await api.updateOrderStatus(orderId, "completed");
      await load();
    } finally {
      setLoadingOrder(null);
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-600";
      case "ready":
        return "bg-yellow-100 text-yellow-600";
      case "completed":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }
  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">👨‍🍳 Kitchen Display</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {orders.map((o) => (
          <div
            key={o.order.id}
            className="bg-white shadow-md sm:shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-base sm:text-lg font-bold">Order #{o.order.id}</div>
                <div className="text-xs sm:text-sm text-gray-500">
                  {o.order.source.toUpperCase()}
                </div>
              </div>
              <span
                className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${statusColor(
                  o.order.status
                )}`}
              >
                {o.order.status}
              </span>
            </div>

            {/* Items */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-2">
              {o.items.map((it) => (
                <div
                  key={it.id}
                  className="p-2 sm:p-3 border rounded-lg flex justify-between items-center"
                >
                  <div className="font-medium text-sm sm:text-base">{it.menu_name}</div>
                  <div className="text-xs sm:text-sm text-gray-500">x{it.quantity}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 sm:mt-5 flex gap-2 sm:gap-3">
              <button
                onClick={() => markReady(o.order.id)}
                disabled={
                  o.order.status !== "pending" ||
                  (loadingOrder?.id === o.order.id && loadingOrder?.action === "ready")
                }
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition text-sm sm:text-base ${o.order.status !== "pending"
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  }`}
              >
                {loadingOrder?.id === o.order.id && loadingOrder?.action === "ready" ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Mark Ready
              </button>

              <button
                onClick={() => complete(o.order.id)}
                disabled={
                  o.order.status === "completed" ||
                  (loadingOrder?.id === o.order.id && loadingOrder?.action === "completed")
                }
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition text-sm sm:text-base ${o.order.status === "completed"
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
              >
                {loadingOrder?.id === o.order.id && loadingOrder?.action === "completed" ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

}
