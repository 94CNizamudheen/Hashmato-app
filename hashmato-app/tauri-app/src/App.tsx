import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Loader from "./components/Loader"; 

// Lazy imports
const POSPage = lazy(() => import("./pages/POSPage"));
const KioskPage = lazy(() => import("./pages/KioskPage"));
const KDSPage = lazy(() => import("./pages/KDSPage"));
const QueuePage = lazy(() => import("./pages/QueuePage"));

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto bg-slate-200">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<POSPage />} />
              <Route path="/kiosk" element={<KioskPage />} />
              <Route path="/kds" element={<KDSPage />} />
              <Route path="/queue" element={<QueuePage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
