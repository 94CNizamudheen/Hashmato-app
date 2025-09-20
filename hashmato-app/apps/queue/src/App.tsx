import { useEffect, useState } from "react";
import { api } from "../../../apps/shared/src/api";
import type { QueueToken } from "../../../apps/shared/src/types";

export default function App() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);

  async function fetchQueue() {
    try {
      const res = await api.get<QueueToken[]>("/queue");
      console.log("res",res)
      setTokens(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Queue Display</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {tokens.map(t => (
          <div key={t.id} style={{ width: 140, height: 100, border: "2px solid #444", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontSize: 20 }}>Token</div>
            <div style={{ fontSize: 32 }}>{t.token_number}</div>
            <div style={{ fontSize: 12 }}>{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
