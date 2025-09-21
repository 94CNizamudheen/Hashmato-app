import { useEffect, useState } from "react";
import MenuCard from "../components/MenuCard";
import CartSidebar from "../components/CartSidebar";
import * as api from "../services/api";
import { db } from "../db/dexie";
import { AppMenuItem, CartItem, LocalOrder, OrderDetailed } from "../types";
import { MenuIcon, Search } from "lucide-react";
import { openDrawer, printReceipt } from "../services/peripherals";
import PeripheralModal from "../components/PeripheralModal";



export default function POSPage() {
  const [menu, setMenu] = useState<AppMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrder, setLastOrder] = useState<OrderDetailed | null>(null);
  useEffect(() => {
    load();
  }, []);

  async function load() {
    const local = await db.menu.toArray();
    if (local.length > 0) setMenu(local);

    try {
      const remote = await api.fetchMenu();
      setMenu(remote);

      for (const it of remote) {
        await db.menu.put({
          id: it.id,
          name: it.name,
          price: Number(it.price),
          available: it.available,
          image_url: it.image_url,
          updated_at: it.updated_at,
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  function add(item: AppMenuItem) {
    setCart((prev) => {
      const found = prev.find((c) => c.id === item.id);
      if (found) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        return [...prev, { ...item, quantity: 1, price: Number(item.price) }];
      }
    });
  }
  async function onCheckout() {
    const localOrder: LocalOrder = {
      source: "pos",
      status: "pending",
      items: cart.map((c) => ({
        menu_item_id: c.id,
        quantity: c.quantity,
      })),
      synced: 0,
      created_at: new Date().toISOString(),
    };

    const id = await db.orders.add(localOrder);

    try {

      const remote = await api.createOrder({ source: "pos", items: localOrder.items });
      localOrder.synced = 1;
      await db.orders.put({ ...localOrder, id });
      const orderDetailed = await api.fetchOrder(remote.order_id);
      setLastOrder(orderDetailed)

      await openDrawer();
      await printReceipt(orderDetailed);

    } catch (e) {
      console.warn("order queued for sync", e);
    }

    setCart([]);
    alert("Order placed");
  }

  const filteredItems = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Point of Sale
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Select items to add to cart
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative w-full max-w-lg">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
              <MenuIcon className="w-14 h-14 sm:w-16 sm:h-16 mb-4" />
              <p className="text-base sm:text-lg font-medium">
                No menu items found
              </p>
              <p className="text-xs sm:text-sm">
                Try adjusting your search or add some menu items
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} onAdd={add} />
            ))
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200">
        <CartSidebar
          cart={cart}
          setCart={setCart}
          onCheckout={onCheckout}
          lastOrder={lastOrder}
        />
      </div>

      <PeripheralModal />
    </div>
  );

}
