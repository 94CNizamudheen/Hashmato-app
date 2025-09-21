import { Menu, Plus } from "lucide-react";
import { AppMenuItem } from "../types";

interface MenuCardProps {
  item: AppMenuItem;
  onAdd: (m: AppMenuItem) => void;
}

export default function MenuCard({ item, onAdd }: MenuCardProps) {
return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Menu className="w-12 h-12 text-slate-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.available 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {item.available ? "Available" : "Unavailable"}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-900 text-lg mb-1">{item.name}</h3>
          <p className="text-2xl font-bold text-blue-600">${Number(item.price).toFixed(2)}</p>
        </div>
        
        <button
          onClick={() => onAdd(item)}
          disabled={!item.available}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
