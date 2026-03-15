import { NextResponse } from "next/server";
import { getCachedStories, setCachedStories } from "@/lib/cache";
import { CATEGORY_QUERIES } from "@/lib/constants";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

function parseArticles(textContent, groundingChunks, category) {
  // First try to extract JSON from the response
  try {
    let cleaned = textContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Build a URL lookup from grounding chunks
        const urlMap = {};
        if (groundingChunks) {
          groundingChunks.forEach((chunk) => {
            if (chunk.web) {
              urlMap[chunk.web.title?.toLowerCase()] = chunk.web.uri;
            }
          });
        }

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
    }
    console.warn("[Placing Jade] No JSON array found in response");
  } catch (e) {
    console.error("[Placing Jade] Parse error:", e.message);
  }
  return [];
}

async function callGemini(contents, useSearch = true) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const body = {
    contents: [
      {
        parts: [{ text: contents }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 6000,
      temperature: 0.7,
    },
  };

  // Add Google Search grounding tool
  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Placing Jade] Gemini ${response.status}:`, errText);
    return { ok: false, status: response.status, error: errText };
  }

  const data = await response.json();
  return { ok: true, data };
}

async function fetchFromGemini(category) {
  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

  const prompt = `You are a positive news curator for "Placing Jade", a website dedicated to uplifting stories. Search for real, recent positive news stories about: ${query}

After searching, return ONLY a valid JSON array with no other text, no markdown backticks, no explanation. Each object must have:
- "title" (string, compelling headline)
- "summary" (string, 4-6 sentences giving a detailed overview — what happened, why it matters, and the broader impact)
- "source" (string, publication name)
- "url" (string, the direct URL to the original article)
- "date" (string, e.g. "March 2026")
- "mood" (one of: hopeful, inspiring, breakthrough, heartwarming)

Return 12-15 real, verifiable stories with accurate URLs. Focus on genuinely positive developments. Return ONLY the JSON array.`;

  // Attempt 1: with Google Search grounding
  console.log(`[Placing Jade] Fetching "${category}" with Google Search grounding`);
  let result = await callGemini(prompt, true);

  // Attempt 2: fallback without search
  if (!result.ok) {
    console.warn(`[Placing Jade] Grounded search failed (${result.status}), retrying without search...`);
    result = await callGemini(prompt, false);
  }

  if (!result.ok) {
    throw new Error(`Gemini API error ${result.status}: ${result.error?.slice(0, 300)}`);
  }

  const data = result.data;
  const candidate = data.candidates?.[0];

  if (!candidate || !candidate.content?.parts) {
    throw new Error("No content in Gemini response");
  }

  // Extract text from all parts
  const allText = candidate.content.parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join("\n");

  // Extract grounding chunks for URLs
  const groundingChunks = candidate.groundingMetadata?.groundingChunks || [];

  if (!allText) {
    throw new Error("No text content in Gemini response");
  }

  return parseArticles(allText, groundingChunks, category);
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
      provider: "Google Gemini",
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
      { error: "GEMINI_API_KEY not set. Add it in Vercel → Settings → Environment Variables, then redeploy." },
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

  // Cache miss — fetch fresh stories
  try {
    const stories = await fetchFromGemini(category);

    if (stories.length === 0) {
      return NextResponse.json(
        { stories: [], cached: false, error: "No stories found" },
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
    console.error("[Placing Jade] Handler error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
