
import { Routes, Route, Link, } from "react-router-dom";
import POSPage from "./pages/POSPage";
import KioskPage from "./pages/KioskPage";
import KDSPage from "./pages/KDSPage";
import QueuePage from "./pages/QueuePage";
import Header from "./components/Header";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="w-56 bg-white border-r p-4">
          <nav className="flex flex-col gap-2">
            <Link to="/" className="py-2 px-3 rounded hover:bg-gray-100">POS</Link>
            <Link to="/kiosk" className="py-2 px-3 rounded hover:bg-gray-100">Kiosk</Link>
            <Link to="/kds" className="py-2 px-3 rounded hover:bg-gray-100">KDS</Link>
            <Link to="/queue" className="py-2 px-3 rounded hover:bg-gray-100">Queue</Link>
          </nav>
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          <Routes>
            <Route path="/" element={<POSPage />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/kds" element={<KDSPage />} />
            <Route path="/queue" element={<QueuePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
