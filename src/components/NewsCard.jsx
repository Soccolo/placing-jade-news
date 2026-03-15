"use client";

import { useState, useEffect } from "react";
import { MOOD_CONFIG } from "@/lib/constants";
import ShareMenu from "./ShareMenu";

export default function NewsCard({ article, index, isBookmarked, onToggleBookmark }) {
  const mood = MOOD_CONFIG[article.mood] || MOOD_CONFIG.hopeful;
  const [visible, setVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100 + 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <article
      className="group rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-500 ease-out border cursor-default"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        background: `linear-gradient(145deg, ${mood.accent}06, ${mood.accent}03)`,
        borderColor: `${mood.accent}12`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 12px 28px ${mood.accent}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Mood emoji */}
      <div className="absolute top-5 right-5 text-xl opacity-50">{mood.emoji}</div>

      {/* Category tag */}
      <div
        className="inline-block px-2.5 py-1 rounded-md text-[0.65rem] font-bold tracking-wider uppercase mb-3 font-body"
        style={{ background: `${mood.accent}12`, color: mood.accent }}
      >
        {article.category}
      </div>

      <h3 className="font-display text-lg sm:text-xl font-bold text-jade-900 leading-snug mb-3 pr-8">
        {article.title}
      </h3>

      <p className="font-body text-[0.84rem] leading-relaxed text-jade-700/65 mb-5">
        {article.summary}
      </p>

      {/* Footer */}
      <div
        className="flex flex-wrap items-center gap-3 pt-4 border-t"
        style={{ borderColor: `${mood.accent}10` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-body text-xs font-semibold truncate" style={{ color: mood.accent }}>
            {article.source}
          </span>
          <span className="text-jade-300 shrink-0">·</span>
          <span className="font-body text-xs text-jade-400 shrink-0">{article.date}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          {/* Bookmark */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className={`
              p-1.5 rounded-full transition-all duration-200 text-xs
              ${isBookmarked
                ? "bg-jade-100 text-jade-600"
                : "opacity-0 group-hover:opacity-100 hover:bg-jade-50 text-jade-400 hover:text-jade-600"}
            `}
            title={isBookmarked ? "Remove bookmark" : "Save story"}
          >
            {isBookmarked ? "🔖" : "📑"}
          </button>

          {/* Share */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(!shareOpen);
              }}
              className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-jade-50 text-jade-400 hover:text-jade-600 transition-all duration-200 text-xs"
              title="Share"
            >
              📤
            </button>
            {shareOpen && (
              <ShareMenu
                article={article}
                onClose={() => setShareOpen(false)}
              />
            )}
          </div>

          {/* Read original */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-body text-[0.7rem] font-semibold transition-all duration-200 hover:translate-x-0.5"
              style={{
                background: `${mood.accent}08`,
                color: mood.accent,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${mood.accent}18`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${mood.accent}08`)}
              onClick={(e) => e.stopPropagation()}
            >
              Read original <span className="text-xs">→</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
