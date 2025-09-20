import React from "react";
import { CartItem } from "../types";

interface CartSidebarProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckout: () => void;
}

export default function CartSidebar({ cart, setCart, onCheckout }: CartSidebarProps) {
  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  function decrease(item: CartItem) {
    if (item.quantity <= 1) {
      setCart(cart.filter((c) => c.id !== item.id));
    } else {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c)));
    }
  }

  function increase(item: CartItem) {
    setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
  }

  return (
    <div className="w-96 bg-white border-l p-4 flex flex-col">
      <h3 className="font-bold mb-3">Cart</h3>
      <div className="flex-1 overflow-auto">
        {cart.map((it) => (
          <div key={it.id} className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-gray-500">
                x{it.quantity} • ${it.price}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => decrease(it)}>-</button>
              <button onClick={() => increase(it)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <div className="text-right font-bold mb-2">Total: ${total.toFixed(2)}</div>
        <button onClick={onCheckout} className="w-full py-2 bg-green-600 text-white rounded">
          Checkout
        </button>
      </div>
    </div>
  );
}
