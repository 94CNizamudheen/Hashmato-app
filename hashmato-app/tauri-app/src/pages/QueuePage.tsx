import  { useEffect, useState } from "react";
import * as api from "../services/api";
import { connectWS, onQueueUpdate } from "../services/ws";
import { QueueToken } from "../types";

export default function QueuePage(){
  const [queue, setQueue] = useState<QueueToken[]>([]);
  useEffect(()=>{ load(); connectWS(); const off = onQueueUpdate((q)=> setQueue(q)); return off }, []);
  async function load(){
    const res = await api.listQueue();
    setQueue(res);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Queue</h2>
      <div className="grid grid-cols-4 gap-3">
        {queue.map(q=>(
          <div key={q.id} className="bg-white p-4 rounded text-center">
            <div className="text-3xl font-bold">{q.token_number}</div>
            <div className="text-sm text-gray-500">{q.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
