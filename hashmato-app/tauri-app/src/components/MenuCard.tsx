
import { AppMenuItem } from "../types"; 

interface MenuCardProps {
  item: AppMenuItem;
  onAdd: (m: AppMenuItem) => void;
}

export default function MenuCard({ item, onAdd }: MenuCardProps) {
  return (
    <div className="bg-white p-3 rounded shadow-sm flex flex-col">
      <div className="flex items-center gap-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-20 h-20 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded" />
        )}
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-500">
            ${Number(item.price).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <button
          onClick={() => onAdd(item)}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
}
