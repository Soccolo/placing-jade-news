"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import StoryOfTheDay from "@/components/StoryOfTheDay";
import NewsCard from "@/components/NewsCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Toast from "@/components/Toast";
import AdSlot from "@/components/AdSlot";
import SponsoredCard from "@/components/SponsoredCard";
import { AD_SLOTS } from "@/lib/adConfig";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Client-side cache — stores fetched stories per category in the browser session
  const clientCache = useRef(new Map());
  const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("pj-bookmarks");
      if (saved) setBookmarks(JSON.parse(saved));
      // Restore client cache from sessionStorage
      const savedCache = sessionStorage.getItem("pj-story-cache");
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        Object.entries(parsed).forEach(([key, val]) => {
          clientCache.current.set(key, val);
        });
      }
    } catch {}
  }, []);

  // Persist bookmarks
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pj-bookmarks", JSON.stringify(bookmarks));
    }
  }, [bookmarks, mounted]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const toggleBookmark = useCallback(
    (article) => {
      setBookmarks((prev) => {
        const exists = prev.find((b) => b.title === article.title);
        if (exists) {
          showToast("Removed from bookmarks");
          return prev.filter((b) => b.title !== article.title);
        } else {
          showToast("Saved to bookmarks ✦");
          return [...prev, { ...article, bookmarkedAt: Date.now() }];
        }
      });
    },
    [showToast]
  );

  const isBookmarked = useCallback(
    (article) => bookmarks.some((b) => b.title === article.title),
    [bookmarks]
  );

  const saveClientCache = useCallback(() => {
    try {
      const obj = {};
      clientCache.current.forEach((val, key) => { obj[key] = val; });
      sessionStorage.setItem("pj-story-cache", JSON.stringify(obj));
    } catch {}
  }, []);

  const loadNews = async (category) => {
    setActiveCategory(category);
    setShowBookmarks(false);
    setError(null);

    // Check client-side cache first
    const cached = clientCache.current.get(category);
    if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
      setArticles(cached.stories);
      setFromCache(true);
      return;
    }

    setLoading(true);
    setArticles([]);
    setStatus("Searching for good news...");

    try {
      const res = await fetch(`/api/news?category=${category}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setFromCache(data.cached || false);

      if (!data.stories || data.stories.length === 0) {
        setError("No stories found — try another category!");
      } else {
        setArticles(data.stories);
        // Store in client cache
        clientCache.current.set(category, {
          stories: data.stories,
          fetchedAt: Date.now(),
        });
        saveClientCache();
      }
    } catch (e) {
      console.error("loadNews error:", e);
      setError(e.message || "Couldn't fetch stories. Please try again.");
    }
    setLoading(false);
    setStatus("");
  };

  // Find story of the day — the first "breakthrough" or "inspiring" story
  const storyOfTheDay =
    articles.find((a) => a.mood === "breakthrough" || a.mood === "inspiring") ||
    articles[0];

  const remainingArticles = articles.filter((a) => a !== storyOfTheDay);

  return (
    <div className="min-h-screen bg-gradient-to-br from-jade-50 via-sand-50 to-jade-50 relative">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {["🌿", "🌸", "🦋", "🌱", "✨"].map((emoji, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              fontSize: `${18 + i * 6}px`,
              opacity: 0.06,
              top: `${10 + i * 18}%`,
              left: `${5 + i * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.7}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        <Header
          bookmarkCount={bookmarks.length}
          showBookmarks={showBookmarks}
          onToggleBookmarks={() => {
            setShowBookmarks(!showBookmarks);
            if (!showBookmarks) setArticles([]);
          }}
        />

        {!showBookmarks && (
          <CategoryNav
            activeCategory={activeCategory}
            loading={loading}
            onSelect={loadNews}
          />
        )}

        <main className="pb-20">
          {/* Bookmarks view */}
          {showBookmarks && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-jade-500 font-semibold font-body">
                  {bookmarks.length} saved{" "}
                  {bookmarks.length === 1 ? "story" : "stories"}
                </span>
                <div className="flex-1 h-px bg-jade-100" />
              </div>
              {bookmarks.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔖</div>
                  <p className="text-jade-700 font-display text-xl font-semibold mb-2">
                    No bookmarks yet
                  </p>
                  <p className="text-jade-500/70 font-body text-sm">
                    Save stories you love and they&apos;ll appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {bookmarks.map((article, i) => (
                    <NewsCard
                      key={article.title + i}
                      article={article}
                      index={i}
                      isBookmarked={true}
                      onToggleBookmark={() => toggleBookmark(article)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {!showBookmarks && !loading && articles.length === 0 && !error && (
            <div className="text-center py-20 animate-fade-in">
              <div className="text-7xl mb-5 animate-float">🌍</div>
              <h2 className="font-display text-3xl font-bold text-jade-900 mb-3">
                The world is getting better
              </h2>
              <p className="text-jade-500/70 font-body text-base max-w-md mx-auto mb-6 leading-relaxed">
                Choose a category above to discover uplifting stories from
                around the globe.
              </p>
              <div className="inline-flex items-center gap-2 bg-jade-50 border border-jade-100 px-5 py-2.5 rounded-full text-jade-600 text-sm font-medium font-body">
                <span className="animate-pulse">●</span>
                Powered by AI · Real stories, verified sources
              </div>
            </div>
          )}

          {/* Loading state */}
          {!showBookmarks && loading && (
            <>
              {status && (
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-jade-500 animate-pulse" />
                  <span className="text-sm text-jade-600 font-medium font-body">
                    {status}
                  </span>
                </div>
              )}
              <LoadingSkeleton />
            </>
          )}

          {/* Error state */}
          {!showBookmarks && error && (
            <div className="text-center py-16 animate-fade-in">
              <div className="text-5xl mb-4">😔</div>
              <p className="text-warmth-500 font-body text-base mb-4">
                {error}
              </p>
              <button
                onClick={() => loadNews(activeCategory)}
                className="font-body text-sm font-semibold text-jade-500 bg-jade-50 hover:bg-jade-100 px-5 py-2.5 rounded-full transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Stories */}
          {!showBookmarks && !loading && articles.length > 0 && (
            <>
              {/* Cache indicator */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs text-jade-400 font-body font-medium">
                  {articles.length} stories
                  {fromCache && " · served from cache"}
                </span>
                <div className="flex-1 h-px bg-jade-100" />
              </div>

              {/* Story of the Day */}
              {storyOfTheDay && (
                <StoryOfTheDay
                  article={storyOfTheDay}
                  isBookmarked={isBookmarked(storyOfTheDay)}
                  onToggleBookmark={() => toggleBookmark(storyOfTheDay)}
                />
              )}

              {/* Banner ad between featured story and grid */}
              <AdSlot slot={AD_SLOTS.banner} className="my-6" />

              {/* Remaining stories grid with in-feed sponsored card */}
              {remainingArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                  {remainingArticles.map((article, i) => {
                    const cards = [];

                    // Insert sponsored card after the 2nd story
                    if (i === 2) {
                      cards.push(
                        <SponsoredCard key="sponsored-in-feed" index={i} />
                      );
                    }

                    cards.push(
                      <NewsCard
                        key={article.id}
                        article={article}
                        index={i}
                        isBookmarked={isBookmarked(article)}
                        onToggleBookmark={() => toggleBookmark(article)}
                      />
                    );

                    return cards;
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer ad */}
        <AdSlot slot={AD_SLOTS.footerBanner} className="mb-4" />

        {/* Footer */}
        <footer className="border-t border-jade-100 py-7 flex flex-wrap justify-between items-center gap-3">
          <span className="text-xs text-jade-400 font-body">
            💎 Placing Jade · Good news, beautifully told
          </span>
          <span className="text-xs text-jade-300 font-body">
            Stories curated by AI · Always from real sources
          </span>
        </footer>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
