type QueueListener = (data: any) => void;

let socket: WebSocket | null = null;
const listeners: QueueListener[] = [];

export function connectWS() {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  socket = new WebSocket((import.meta.env.VITE_API_WS || (import.meta.env.VITE_API_BASE || "http://localhost:8080"))!.replace(/^http/, "ws") + "/ws");
  socket.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      listeners.forEach(l => l(data));
    } catch (e) { console.warn(e); }
  };
  socket.onopen = () => console.info("ws open");
  socket.onclose = () => {
    console.info("ws closed, reconnect in 2s");
    setTimeout(connectWS, 2000);
  };
}

export function onQueueUpdate(cb: QueueListener) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
