import { useEffect, useState } from "react";
import { ReceiptPayload } from "../types";
import { X, DollarSign, Receipt, CheckCircle } from "lucide-react";

type ModalState =
  | { type: "drawer" }
  | { type: "receipt"; payload: ReceiptPayload }
  | null;

export default function PeripheralModal() {
  const [modal, setModal] = useState<ModalState>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      const custom = e as CustomEvent;
      setModal(custom.detail);
      setIsVisible(true);
    }
    window.addEventListener("peripheral-action", handler);
    return () => window.removeEventListener("peripheral-action", handler);
  }, []);

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => setModal(null), 150);
  };

  if (!modal) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
    >
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-md transform transition-all duration-300 ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            {modal.type === "drawer" ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            )}
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
              {modal.type === "drawer" ? "Cash Drawer" : "Receipt Preview"}
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors duration-200 group"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-slate-700" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {modal.type === "drawer" && (
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                The cash drawer has been opened successfully
              </p>
              <div className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 bg-green-50 rounded-xl sm:rounded-2xl border border-green-100">
                <p className="text-green-700 text-xs sm:text-sm font-medium">
                  Running in stub mode
                </p>
              </div>
            </div>
          )}

          {modal.type === "receipt" && (
            <div>
              {/* Order Info */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-slate-500 text-sm sm:text-base">
                    Order Number
                  </p>
                  <p className="font-mono font-bold text-slate-800 bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base">
                    #{modal.payload.order_id}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">
                  Order Items
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {modal.payload.items.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs sm:text-sm">
                            {it.qty}
                          </span>
                        </div>
                        <span className="text-slate-700 font-medium text-sm sm:text-base">
                          {it.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        ${(it.price * it.qty).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-semibold text-slate-700">
                    Total Amount
                  </span>
                  <span className="text-lg sm:text-2xl font-bold text-slate-800">
                    ${modal.payload.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={closeModal}
            className="mt-4 sm:mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

}