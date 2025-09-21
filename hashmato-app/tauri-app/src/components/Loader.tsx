// src/components/Loader.tsx
import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full space-y-4">
      {/* Animated Hashmato Logo Circle */}
      <motion.div
        className="h-16 w-16 border-4 border-slate-300 border-t-slate-900 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      {/* Modern Gradient Text */}
      <motion.p
        className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Loading Hashmato...
      </motion.p>
    </div>
  );
}
