import { NextResponse } from "next/server";
import { getCachedStories, setCachedStories } from "@/lib/cache";
import { CATEGORY_QUERIES } from "@/lib/constants";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Use a widely available model
const MODEL = "claude-sonnet-4-5-20250929";

function parseArticles(textContent, category) {
  try {
    let cleaned = textContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
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
    }
    console.warn("[Placing Jade] No JSON array found in response");
  } catch (e) {
    console.error("[Placing Jade] Parse error:", e.message);
  }
  return [];
}

async function callAnthropic(body) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Placing Jade] Anthropic ${response.status}:`, errText);
    return { ok: false, status: response.status, error: errText };
  }

  const data = await response.json();
  return { ok: true, data };
}

async function fetchFromAnthropic(category) {
  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

  const systemPrompt = `You are a positive news curator for "Placing Jade", a website dedicated to uplifting stories. Search for real, recent positive news stories, then return your findings.

After searching, return ONLY a valid JSON array with no other text, no markdown backticks, no explanation. Each object must have:
- "title" (string, compelling headline)
- "summary" (string, 4-6 sentences giving a detailed overview — what happened, why it matters, and the broader impact)
- "source" (string, publication name)
- "url" (string, the direct URL to the original article)
- "date" (string, e.g. "March 2026")
- "mood" (one of: hopeful, inspiring, breakthrough, heartwarming)

Return 5-7 real, verifiable stories with accurate URLs. Focus on genuinely positive developments.`;

  const userMessage = `Find recent positive news about: ${query}. Return ONLY the JSON array.`;

  // Attempt 1: with web search
  console.log(`[Placing Jade] Fetching "${category}" with web search, model=${MODEL}`);
  let result = await callAnthropic({
    model: MODEL,
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
  });

  // Attempt 2: if web search failed, retry without tools
  if (!result.ok) {
    console.warn(`[Placing Jade] Web search failed (${result.status}), retrying without tools...`);

    result = await callAnthropic({
      model: MODEL,
      max_tokens: 3000,
      system: systemPrompt + "\n\nNote: Web search is unavailable. Use your existing knowledge to provide real stories. Include accurate details.",
      messages: [{ role: "user", content: userMessage }],
    });
  }

  // If still failing, throw with the actual Anthropic error
  if (!result.ok) {
    throw new Error(`Anthropic API error ${result.status}: ${result.error?.slice(0, 300)}`);
  }

  const data = result.data;

  const allText = (data.content || [])
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");

  if (!allText) {
    throw new Error("No text content in API response");
  }

  return parseArticles(allText, category);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";

  // Debug endpoint — visit /api/news?debug=true to check your config
  if (searchParams.get("debug") === "true") {
    return NextResponse.json({
      hasApiKey: !!ANTHROPIC_API_KEY,
      keyPrefix: ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.slice(0, 10) + "..." : "NOT SET",
      model: MODEL,
      categories: Object.keys(CATEGORY_QUERIES),
      timestamp: new Date().toISOString(),
    });
  }

  // Validate category
  if (!CATEGORY_QUERIES[category]) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Check API key
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set. Add it in Vercel → Settings → Environment Variables, then redeploy." },
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
    const stories = await fetchFromAnthropic(category);

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
