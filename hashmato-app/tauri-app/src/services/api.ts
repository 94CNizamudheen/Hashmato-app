import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export async function fetchMenu() {
  const res = await client.get("/menu");
  return res.data;
}

export async function createMenuItem(payload: any) {
  return client.post("/menu", payload).then(r => r.data);
}

export async function uploadImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await client.post("/menu/upload", fd, { headers: { "Content-Type": "multipart/form-data" }});
  return res.data;
}

export async function createOrder(payload: any) {
  const res = await client.post("/orders", payload);
  return res.data;
}

export async function listOrdersDetailed() {
  const res = await client.get("/orders/detailed");
  return res.data;
}

export async function listQueue() {
  const res = await client.get("/queue");
  return res.data;
}

export async function updateOrderStatus(id: number, status: string) {
  return client.put(`/orders/${id}/status`, { status });
}

export async function syncMenu(since?: string) {
  const params = since ? { since } : {};
  return client.get("/sync/menu", { params }).then(r => r.data);
}

export async function syncOrders(since?: string) {
  const params = since ? { since } : {};
  return client.get("/sync/orders", { params }).then(r => r.data);
}
