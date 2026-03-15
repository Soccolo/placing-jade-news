import { NextResponse } from "next/server";
import { getCachedStories, setCachedStories } from "@/lib/cache";
import { CATEGORY_QUERIES } from "@/lib/constants";

// Increase Vercel serverless function timeout (default is 10s, max 60s on Hobby)
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

function parseArticles(textContent, groundingChunks, category) {
  // Build URL lookup from grounding metadata
  const groundingUrls = (groundingChunks || [])
    .filter((c) => c.web)
    .map((c) => ({ title: c.web.title, url: c.web.uri }));

  try {
    let cleaned = textContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*?\](?=\s*$|\s*[^,\]\}])/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a, i) => {
          // Try to match a grounding URL if the article URL is missing or is a redirect
          let articleUrl = a.url || null;
          if (!articleUrl || articleUrl.includes("vertexaisearch.cloud.google.com")) {
            const match = groundingUrls.find(
              (g) =>
                g.title &&
                a.title &&
                (g.title.toLowerCase().includes(a.source?.toLowerCase()) ||
                  a.title.toLowerCase().includes(g.title.toLowerCase().slice(0, 20)))
            );
            if (match) articleUrl = match.url;
          }

          return {
            id: `${category}-${Date.now()}-${i}`,
            title: a.title || "Untitled Story",
            summary: a.summary || a.description || "",
            source: a.source || "Unknown",
            url: articleUrl,
            date: a.date || "Recent",
            mood: ["hopeful", "inspiring", "breakthrough", "heartwarming"].includes(a.mood)
              ? a.mood
              : "hopeful",
            category,
          };
        });
      }
    }

    // Fallback: try to find any JSON array in the text
    const anyArray = cleaned.match(/\[[\s\S]*\]/);
    if (anyArray) {
      try {
        const parsed = JSON.parse(anyArray[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a, i) => ({
            id: `${category}-${Date.now()}-${i}`,
            title: a.title || "Untitled Story",
            summary: a.summary || a.description || "",
            source: a.source || "Unknown",
            url: a.url || null,
            date: a.date || "Recent",
            mood: ["hopeful", "inspiring", "breakthrough", "heartwarming"].includes(a.mood)
              ? a.mood
              : "hopeful",
            category,
          }));
        }
      } catch {}
    }

    console.warn("[PJ] No JSON array found. Response preview:", cleaned.slice(0, 500));
  } catch (e) {
    console.error("[PJ] Parse error:", e.message, "Text preview:", textContent.slice(0, 300));
  }
  return [];
}

async function fetchFromGemini(category) {
  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are a positive news curator for "Placing Jade". Search the web for real, recent positive news stories about: ${query}

After finding stories, return ONLY a JSON array (no other text, no markdown). Each object needs:
- "title": compelling headline (string)
- "summary": 4-6 sentences on what happened, why it matters, broader impact (string)
- "source": publication name (string)
- "url": direct URL to original article (string)
- "date": approximate date like "March 2026" (string)
- "mood": one of "hopeful", "inspiring", "breakthrough", "heartwarming" (string)

Return 10-12 real, verifiable stories. IMPORTANT: Your response must start with [ and end with ]. No other text before or after the JSON array.`;

  console.log(`[PJ] Fetching "${category}" with Google Search...`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 8000,
        temperature: 0.7,
      },
      tools: [{ google_search: {} }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[PJ] Gemini ${response.status}:`, errText.slice(0, 500));
    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate?.content?.parts) {
    console.error("[PJ] No candidate. Full response:", JSON.stringify(data).slice(0, 500));
    throw new Error("No content in Gemini response");
  }

  const text = candidate.content.parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join("\n");

  const groundingChunks = candidate.groundingMetadata?.groundingChunks || [];

  console.log(`[PJ] Got ${text.length} chars, ${groundingChunks.length} grounding chunks. Parsing...`);

  const articles = parseArticles(text, groundingChunks, category);

  if (articles.length === 0) {
    // Log what we got so we can debug
    console.error("[PJ] Parse returned 0 articles. Text preview:", text.slice(0, 800));
    console.error("[PJ] Finish reason:", candidate.finishReason);
  }

  return articles;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";

  // Debug endpoint
  if (searchParams.get("debug") === "true") {
    return NextResponse.json({
      hasApiKey: !!GEMINI_API_KEY,
      keyPrefix: GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 10) + "..." : "NOT SET",
      model: MODEL,
      provider: "Google Gemini (with Search)",
      maxDuration: 60,
      categories: Object.keys(CATEGORY_QUERIES),
      timestamp: new Date().toISOString(),
    });
  }

  // Validate category
  if (!CATEGORY_QUERIES[category]) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Check API key
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set. Add it in Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  // Check cache first
  const cached = getCachedStories(category);
  if (cached) {
    return NextResponse.json({
      stories: cached.stories,
      cached: true,
      cachedAt: cached.cachedAt,
    });
  }

  // Fetch fresh stories
  try {
    const stories = await fetchFromGemini(category);

    if (stories.length === 0) {
      return NextResponse.json(
        { stories: [], cached: false, error: "No stories found — please try again" },
        { status: 200 }
      );
    }

    setCachedStories(category, stories);

    return NextResponse.json({
      stories,
      cached: false,
      cachedAt: Date.now(),
    });
  } catch (e) {
    console.error("[PJ] Error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
