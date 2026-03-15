import { NextResponse } from "next/server";
import { getCachedStories, setCachedStories } from "@/lib/cache";
import { CATEGORY_QUERIES } from "@/lib/constants";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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
    console.warn("No JSON array found in response");
  } catch (e) {
    console.error("Parse error:", e.message);
  }
  return [];
}

async function fetchFromAnthropic(category) {
  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `You are a positive news curator for "Placing Jade", a website dedicated to uplifting stories. You MUST search the web for real, recent positive news stories, then return your findings.

After searching, return ONLY a valid JSON array with no other text, no markdown backticks, no explanation. Each object must have:
- "title" (string, compelling headline)
- "summary" (string, 4-6 sentences giving a detailed overview — what happened, why it matters, and the broader impact)
- "source" (string, publication name)
- "url" (string, the direct URL to the original article)
- "date" (string, e.g. "March 2026")
- "mood" (one of: hopeful, inspiring, breakthrough, heartwarming)

Return 5-7 real, verifiable stories with accurate URLs. Focus on genuinely positive developments.`,
      messages: [
        {
          role: "user",
          content: `Search the web for recent positive news about: ${query}. Return ONLY the JSON array.`,
        },
      ],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Anthropic API error:", response.status, errText);
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const data = await response.json();

  const allText = (data.content || [])
    .map((block) => {
      if (block.type === "text") return block.text;
      if (block.type === "tool_result" && block.content) {
        return block.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");
      }
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

  // Validate category
  if (!CATEGORY_QUERIES[category]) {
    return NextResponse.json(
      { error: "Invalid category" },
      { status: 400 }
    );
  }

  // Check API key
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured. Add ANTHROPIC_API_KEY to .env.local" },
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

    // Cache the results
    setCachedStories(category, stories);

    return NextResponse.json({
      stories,
      cached: false,
      cachedAt: Date.now(),
    });
  } catch (e) {
    console.error("Fetch error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
