import { Bell, Settings, Store } from "lucide-react";

const Header = () => {
   return (
    <header className="h-16 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center px-6 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-white">Hashmato</div>
        </div>
        <div className="text-sm text-slate-300">All-in-One POS · Kiosk · KDS · Queue</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

export default Header

