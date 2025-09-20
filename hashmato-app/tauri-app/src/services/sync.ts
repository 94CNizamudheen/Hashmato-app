import { db } from "../db/dexie";
import * as api from "./api";
import { AppMenuItem, LocalOrder } from "../types";

export async function pullMenuDelta() {
  const lastRecord = await db.menu.orderBy("updated_at").last();
  const lastUpdated = lastRecord?.updated_at;
  const res = await api.syncMenu(lastUpdated);

  const items: AppMenuItem[] = res.menu ?? [];
  for (const it of items) {
    await db.menu.put({
      id: it.id,
      name: it.name,
      price: Number(it.price),
      available: it.available,
      image_url: it.image_url,
      updated_at: it.updated_at,
    });
  }
}

export async function pushLocalOrders() {
  const pending: LocalOrder[] = await db.orders
    .where("synced")
    .equals(0)
    .toArray();

  for (const o of pending) {
    const payload = { source: o.source, items: o.items };
    try {
      await api.createOrder(payload);
      o.synced = 1;
      await db.orders.put(o);
    } catch (e) {
      console.error("sync order failed", e);
    }
  }
}

// periodic sync
export function startAutoSync(intervalMs = 5000) {
  setInterval(async () => {
    try {
      await pullMenuDelta();
      await pushLocalOrders();
    } catch (e) {
      console.warn("sync failed", e);
    }
  }, intervalMs);
}
