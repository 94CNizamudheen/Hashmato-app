import { Routes, Route } from "react-router-dom";
import POSPage from "./pages/POSPage";
import KioskPage from "./pages/KioskPage";
import KDSPage from "./pages/KDSPage";
import QueuePage from "./pages/QueuePage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"; 

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <Header />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto bg-slate-200">
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
