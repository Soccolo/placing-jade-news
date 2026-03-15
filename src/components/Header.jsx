"use client";

import { useState, useEffect } from "react";

export default function Header({ bookmarkCount, showBookmarks, onToggleBookmarks }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <header
      className="pt-10 sm:pt-12 pb-6 transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-16px)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-jade-500 to-jade-400 flex items-center justify-center text-xl shadow-lg shadow-jade-500/20">
              💎
            </div>
            <h1 className="font-display text-3xl sm:text-[2.1rem] font-extrabold text-jade-900 tracking-tight">
              Placing Jade
            </h1>
          </div>
          <p className="font-body text-jade-500/70 text-[0.95rem] ml-[3.6rem] max-w-md leading-relaxed">
            Good news for the world. Stories of conservation, discovery, and
            human progress — curated by AI.
          </p>
        </div>

        {/* Bookmarks button */}
        <button
          onClick={onToggleBookmarks}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-medium
            transition-all duration-200 mt-2
            ${
              showBookmarks
                ? "bg-jade-500 text-white shadow-lg shadow-jade-500/25"
                : "bg-white border border-jade-200 text-jade-600 hover:border-jade-300 hover:shadow-sm"
            }
          `}
        >
          <span className="text-base">🔖</span>
          Saved
          {bookmarkCount > 0 && (
            <span
              className={`
                text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                ${showBookmarks ? "bg-white/25 text-white" : "bg-jade-100 text-jade-600"}
              `}
            >
              {bookmarkCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
