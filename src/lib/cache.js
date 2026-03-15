import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const DEFAULT_TTL_HOURS = parseInt(process.env.CACHE_DURATION_HOURS || "3", 10);

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(category) {
  return path.join(CACHE_DIR, `news-${category}.json`);
}

/**
 * Get cached stories for a category if they exist and aren't expired.
 * Returns { stories, cachedAt } or null if cache miss.
 */
export function getCachedStories(category) {
  try {
    ensureCacheDir();
    const cachePath = getCachePath(category);

    if (!fs.existsSync(cachePath)) return null;

    const raw = fs.readFileSync(cachePath, "utf-8");
    const cached = JSON.parse(raw);

    const ageMs = Date.now() - cached.cachedAt;
    const ttlMs = DEFAULT_TTL_HOURS * 60 * 60 * 1000;

    if (ageMs > ttlMs) {
      // Cache expired
      fs.unlinkSync(cachePath);
      return null;
    }

    return cached;
  } catch (e) {
    console.error("Cache read error:", e.message);
    return null;
  }
}

/**
 * Store stories in the cache for a category.
 */
export function setCachedStories(category, stories) {
  try {
    ensureCacheDir();
    const cachePath = getCachePath(category);
    const data = {
      category,
      stories,
      cachedAt: Date.now(),
      expiresAt: Date.now() + DEFAULT_TTL_HOURS * 60 * 60 * 1000,
    };
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Cache write error:", e.message);
  }
}

/**
 * Get cache status for all categories.
 */
export function getCacheStatus() {
  try {
    ensureCacheDir();
    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.startsWith("news-"));
    return files.map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, f), "utf-8"));
      const ageMinutes = Math.round((Date.now() - raw.cachedAt) / 60000);
      return {
        category: raw.category,
        storyCount: raw.stories?.length || 0,
        ageMinutes,
        expired:
          Date.now() - raw.cachedAt > DEFAULT_TTL_HOURS * 60 * 60 * 1000,
      };
    });
  } catch {
    return [];
  }
}
