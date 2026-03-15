/**
 * In-memory cache for Vercel serverless functions.
 *
 * Uses a module-level Map that persists as long as the serverless
 * function instance stays warm (typically 5-15 minutes between requests).
 *
 * This replaces the file-based cache which doesn't work on Vercel's
 * ephemeral filesystem.
 */

const DEFAULT_TTL_HOURS = parseInt(process.env.CACHE_DURATION_HOURS || "12", 10);

// Module-level cache — survives across requests in the same warm instance
const memoryCache = new Map();

/**
 * Get cached stories for a category if they exist and aren't expired.
 * Returns { stories, cachedAt } or null if cache miss.
 */
export function getCachedStories(category) {
  const cached = memoryCache.get(category);
  if (!cached) return null;

  const ageMs = Date.now() - cached.cachedAt;
  const ttlMs = DEFAULT_TTL_HOURS * 60 * 60 * 1000;

  if (ageMs > ttlMs) {
    memoryCache.delete(category);
    return null;
  }

  console.log(`[Placing Jade] Cache HIT for "${category}" (age: ${Math.round(ageMs / 60000)}m)`);
  return cached;
}

/**
 * Store stories in the cache for a category.
 */
export function setCachedStories(category, stories) {
  memoryCache.set(category, {
    category,
    stories,
    cachedAt: Date.now(),
  });
  console.log(`[Placing Jade] Cached ${stories.length} stories for "${category}"`);
}

/**
 * Get cache status for all categories.
 */
export function getCacheStatus() {
  const status = [];
  for (const [category, cached] of memoryCache) {
    const ageMinutes = Math.round((Date.now() - cached.cachedAt) / 60000);
    status.push({
      category,
      storyCount: cached.stories?.length || 0,
      ageMinutes,
      expired: Date.now() - cached.cachedAt > DEFAULT_TTL_HOURS * 60 * 60 * 1000,
    });
  }
  return status;
}
