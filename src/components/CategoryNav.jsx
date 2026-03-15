"use client";

import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryNav({ activeCategory, loading, onSelect }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  return (
    <nav
      className="pb-7 flex gap-2.5 flex-wrap transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
      }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            disabled={loading}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full font-body text-[0.82rem] font-medium
              transition-all duration-250 cursor-pointer
              disabled:cursor-wait disabled:opacity-50
              ${
                isActive
                  ? "text-white shadow-lg"
                  : "bg-white border border-jade-200 text-jade-700 hover:border-jade-400 hover:shadow-sm"
              }
            `}
            style={
              isActive
                ? {
                    background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
                    boxShadow: `0 4px 18px ${cat.color}30`,
                  }
                : {}
            }
          >
            <span className="text-sm">{cat.icon}</span>
            {cat.label}
          </button>
        );
      })}
    </nav>
  );
}
