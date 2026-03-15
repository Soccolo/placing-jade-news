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

  // When not using search, we can force JSON output
  if (!useSearch) {
    body.generationConfig.responseMimeType = "application/json";
  }

  console.log(`[Placing Jade] Calling Gemini (search=${useSearch})`);

  const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Placing Jade] Gemini ${response.status}:`, errText.slice(0, 500));
    return { ok: false, status: response.status, error: errText };
  }

  const data = await response.json();
  return { ok: true, data };
}

async function fetchFromGemini(category) {
  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

  // STEP 1: Use Google Search grounding to find real stories
  const searchPrompt = `Find 12-15 recent, real, positive news stories about: ${query}

For each story provide: the headline, a 4-6 sentence summary of what happened and why it matters, the source publication name, the URL, and the approximate date. Focus on genuinely uplifting developments.`;

  console.log(`[Placing Jade] Step 1: Searching for "${category}" stories...`);
  let searchResult = await callGemini(searchPrompt, true);

  let storiesText = "";

  if (searchResult.ok) {
    const candidate = searchResult.data.candidates?.[0];
    if (candidate?.content?.parts) {
      storiesText = candidate.content.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("\n");

      // Also gather URLs from grounding metadata
      const chunks = candidate.groundingMetadata?.groundingChunks || [];
      if (chunks.length > 0) {
        storiesText += "\n\nGrounding sources:\n";
        chunks.forEach((c) => {
          if (c.web) {
            storiesText += `- ${c.web.title}: ${c.web.uri}\n`;
          }
        });
      }
    }
    console.log(`[Placing Jade] Step 1 complete. Got ${storiesText.length} chars of content.`);
  } else {
    console.warn(`[Placing Jade] Grounded search failed, using ungrounded search...`);
    // Fallback: search without grounding
    searchResult = await callGemini(searchPrompt, false);
    if (searchResult.ok) {
      const candidate = searchResult.data.candidates?.[0];
      storiesText = candidate?.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("\n") || "";
    }
  }

  if (!storiesText) {
    throw new Error("No content from search step");
  }

  // STEP 2: Format into clean JSON (no search tool, force JSON output)
  const formatPrompt = `Below are positive news stories found via web search. Convert them into a JSON array. Return ONLY a valid JSON array, no other text.

Each object must have exactly these fields:
- "title": string (compelling headline)
- "summary": string (4-6 sentences)
- "source": string (publication name)
- "url": string (direct URL to original article, or "" if not available)
- "date": string (e.g. "March 2026")
- "mood": string (one of: "hopeful", "inspiring", "breakthrough", "heartwarming")

Here are the stories to format:

${storiesText}`;

  console.log(`[Placing Jade] Step 2: Formatting as JSON...`);
  const formatResult = await callGemini(formatPrompt, false);

  if (!formatResult.ok) {
    throw new Error(`Gemini format step failed: ${formatResult.status}`);
  }

  const formatCandidate = formatResult.data.candidates?.[0];
  const jsonText = formatCandidate?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join("\n") || "";

  console.log(`[Placing Jade] Step 2 complete. Parsing JSON (${jsonText.length} chars)...`);

  if (!jsonText) {
    throw new Error("No text from format step");
  }

  return parseArticles(jsonText, [], category);
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
