"use client";

import { useEffect, useState } from "react";

export default function Toast({ message, type = "success" }) {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("exit"), 2200);
    return () => clearTimeout(timer);
  }, []);

  const bgColor =
    type === "success"
      ? "bg-jade-600"
      : type === "error"
        ? "bg-warmth-500"
        : "bg-jade-600";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`
          ${bgColor} text-white font-body text-sm font-medium
          px-5 py-3 rounded-xl shadow-xl
          transition-all duration-300 ease-out
          ${phase === "enter"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"}
        `}
        style={{
          animation:
            phase === "enter"
              ? "toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards"
              : "toastOut 0.3s ease forwards",
        }}
      >
        {message}
      </div>
    </div>
  );
}
