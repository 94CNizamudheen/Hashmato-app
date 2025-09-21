import { ReceiptPayload, OrderDetailed } from "../types";

function showModal(type: "drawer" | "receipt", payload?: any) {
  const event = new CustomEvent("peripheral-action", { detail: { type, payload } });
  window.dispatchEvent(event);
}

export async function openDrawer(): Promise<void> {
  if (window.__TAURI__) {
    await window.__TAURI__.invoke("open_drawer");
  } else {
    showModal("drawer");
  }
}

export async function printReceipt(order: OrderDetailed): Promise<void> {
  const payload: ReceiptPayload = {
    order_id: order.order.id,
    items: order.items.map((it) => ({
      name: it.menu_name,
      qty: it.quantity,
      price: it.menu_price,
    })),
    total: order.items.reduce((s, it) => s + it.menu_price * it.quantity, 0),
  };

  if (window.__TAURI__) {
    await window.__TAURI__.invoke("print_receipt", { payload });
  } else {
    showModal("receipt", payload);
  }
}
