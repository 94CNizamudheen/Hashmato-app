import { Clock, Menu, Monitor, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";



const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: ShoppingCart, label: "POS", color: "from-blue-500 to-blue-600" },
    { path: "/kiosk", icon: Monitor, label: "Kiosk", color: "from-green-500 to-green-600" },
    { path: "/kds", icon: Menu, label: "KDS", color: "from-orange-500 to-orange-600" },
    { path: "/queue", icon: Clock, label: "Queue", color: "from-purple-500 to-purple-600" },
  ];
  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:block w-56 lg:w-64 bg-slate-50 border-r border-slate-200 shadow-sm">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 group ${isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:scale-110 transition-transform"
                    }`}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-inner flex justify-around py-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs transition ${isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

}

export default Sidebar
