"use client";

import { useEffect, useRef } from "react";

const SHARE_OPTIONS = [
  {
    id: "twitter",
    label: "Twitter / X",
    icon: "𝕏",
    getUrl: (article) => {
      const text = encodeURIComponent(
        `${article.title} — some good news via @PlacingJade ✦`
      );
      const url = article.url ? `&url=${encodeURIComponent(article.url)}` : "";
      return `https://twitter.com/intent/tweet?text=${text}${url}`;
    },
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "in",
    getUrl: (article) => {
      const url = article.url ? encodeURIComponent(article.url) : "";
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    },
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    getUrl: (article) => {
      const text = encodeURIComponent(
        `${article.title}\n\n${article.summary}\n\n${article.url || ""}`
      );
      return `https://wa.me/?text=${text}`;
    },
  },
  {
    id: "copy",
    label: "Copy link",
    icon: "📋",
    action: async (article) => {
      const text = article.url || article.title;
      await navigator.clipboard.writeText(text);
    },
  },
];

export default function ShareMenu({ article, onClose }) {
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl shadow-jade-900/10 border border-jade-100 overflow-hidden z-30 share-menu-enter"
    >
      {SHARE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 font-body text-xs font-medium text-jade-700 hover:bg-jade-50 transition-colors text-left"
          onClick={async (e) => {
            e.stopPropagation();
            if (opt.action) {
              await opt.action(article);
            } else if (opt.getUrl) {
              window.open(opt.getUrl(article), "_blank", "noopener,noreferrer");
            }
            onClose();
          }}
        >
          <span
            className="w-6 h-6 rounded-md bg-jade-50 flex items-center justify-center text-xs font-bold"
            style={{ fontFamily: opt.id === "linkedin" ? "serif" : "inherit" }}
          >
            {opt.icon}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
