"use client";

import { useState, useEffect } from "react";
import { MOOD_CONFIG } from "@/lib/constants";
import ShareMenu from "./ShareMenu";

export default function StoryOfTheDay({ article, isBookmarked, onToggleBookmark }) {
  const mood = MOOD_CONFIG[article.mood] || MOOD_CONFIG.hopeful;
  const [visible, setVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
  }, [article.id]);

  return (
    <article
      className="rounded-2xl p-7 sm:p-9 relative overflow-hidden transition-all duration-600 ease-out border"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        background: `linear-gradient(135deg, ${mood.accent}08, ${mood.accent}04)`,
        borderColor: `${mood.accent}15`,
      }}
    >
      {/* Featured badge */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-bold tracking-widest uppercase font-body"
          style={{ background: `${mood.accent}15`, color: mood.accent }}
        >
          ✦ Story of the Day
        </div>
        <div
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-semibold tracking-wide uppercase font-body"
          style={{ background: `${mood.accent}10`, color: `${mood.accent}aa` }}
        >
          {mood.emoji} {article.category}
        </div>
      </div>

      <h2 className="font-display text-2xl sm:text-[1.7rem] font-bold text-jade-900 leading-snug mb-4 pr-12 max-w-2xl">
        {article.title}
      </h2>

      <p className="font-body text-[0.92rem] leading-relaxed text-jade-700/75 mb-6 max-w-3xl">
        {article.summary}
      </p>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-4 pt-5 border-t" style={{ borderColor: `${mood.accent}10` }}>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs font-semibold" style={{ color: mood.accent }}>
            {article.source}
          </span>
          <span className="text-jade-300">·</span>
          <span className="font-body text-xs text-jade-400">{article.date}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Bookmark */}
          <button
            onClick={onToggleBookmark}
            className={`
              p-2 rounded-full transition-all duration-200 text-sm
              ${isBookmarked
                ? "bg-jade-100 text-jade-600"
                : "hover:bg-jade-50 text-jade-400 hover:text-jade-600"}
            `}
            title={isBookmarked ? "Remove bookmark" : "Save story"}
          >
            {isBookmarked ? "🔖" : "📑"}
          </button>

          {/* Share */}
          <div className="relative">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="p-2 rounded-full hover:bg-jade-50 text-jade-400 hover:text-jade-600 transition-all duration-200 text-sm"
              title="Share story"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-xs font-semibold transition-all duration-200 hover:translate-x-0.5"
              style={{
                background: `${mood.accent}10`,
                color: mood.accent,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${mood.accent}20`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${mood.accent}10`)}
            >
              Read original <span className="text-sm">→</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
