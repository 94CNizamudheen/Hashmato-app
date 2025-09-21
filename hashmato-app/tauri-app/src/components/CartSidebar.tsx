import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { CartItem, OrderDetailed } from "../types";
import { printReceipt, openDrawer } from "../services/peripherals";

interface CartSidebarProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckout: () => void;
  lastOrder: OrderDetailed | null;
}

export default function CartSidebar({
  cart,
  setCart,
  onCheckout,
  lastOrder
}: CartSidebarProps) {

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const updateQuantity = (item: CartItem, change: number) => {
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      setCart(cart.filter(c => c.id !== item.id));
    } else {
      setCart(cart.map(c =>
        c.id === item.id ? { ...c, quantity: newQuantity } : c
      ));
    }
  };

  const removeItem = (itemId: number) => {
    setCart(cart.filter(c => c.id !== itemId));
  };
  return (
    <div className="w-full sm:w-[22rem] lg:w-96 bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-xl flex flex-col h-[60vh] sm:h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            Cart ({cart.length})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
            <p className="text-base sm:text-lg font-medium">Your cart is empty</p>
            <p className="text-xs sm:text-sm">Add items to get started</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 mb-1">{item.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 mb-2">
                    ${item.price.toFixed(2)} each
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <span className="font-medium text-base sm:text-lg min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-base sm:text-lg text-slate-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout & Actions */}
      {cart.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
          <div className="mb-4">
            <div className="flex justify-between items-center text-base sm:text-lg">
              <span className="font-medium text-slate-700">Subtotal:</span>
              <span className="font-bold text-slate-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 mt-1">
              <span>Tax (10%):</span>
              <span>${(total * 0.1).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-300 mt-2 pt-2">
              <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-slate-900">
                <span>Total:</span>
                <span>${(total * 1.1).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 
                     hover:from-green-600 hover:to-green-700 text-white font-bold 
                     rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base"
          >
            Checkout
          </button>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => openDrawer()}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm sm:text-base"
            >
              Open Drawer
            </button>
            <button
              onClick={() => lastOrder && printReceipt(lastOrder)}
              className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg text-sm sm:text-base"
            >
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
