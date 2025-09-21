import { useEffect, useState } from "react";
import * as api from "../services/api";
import { connectWS, onQueueUpdate } from "../services/ws";
import { QueueToken } from "../types";

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueToken[]>([]);

  useEffect(() => {
    load();
    connectWS();
    const off = onQueueUpdate((q) => setQueue(q));
    return off;
  }, []);

  async function load() {
    const res = await api.listQueue();
    setQueue(res);
  }

  function statusStyles(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "ready":
        return "bg-green-50 border-green-200 text-green-700";
      case "completed":
        return "bg-gray-50 border-gray-200 text-gray-500";
      default:
        return "bg-slate-50 border-slate-200 text-slate-600";
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📢 Queue Display</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {queue.map((q) => (
          <div
            key={q.id}
            className={`p-6 rounded-2xl shadow-md border transition transform hover:scale-105 hover:shadow-lg text-center ${statusStyles(
              q.status
            )}`}
          >
            <div className="text-5xl font-extrabold tracking-wider">
              {q.token_number}
            </div>
            <div className="mt-2 text-sm font-semibold uppercase">
              {q.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
