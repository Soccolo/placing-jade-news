# 💎 Placing Jade — Good News for the World

A positive news aggregator that uses AI to curate uplifting stories about conservation, medical breakthroughs, sustainability, and scientific discovery.

## Features

- **AI-curated news** — Uses Claude (via Anthropic API) with web search to find real, verified positive stories
- **Server-side caching** — Stories are cached for 3 hours to reduce API calls and speed up loading
- **Story of the Day** — The most impactful story gets featured prominently
- **Bookmarks** — Save favourite stories locally (persisted in localStorage)
- **Social sharing** — Share stories to Twitter/X, LinkedIn, WhatsApp, or copy the link
- **5 categories** — All Stories, Conservation, Medical Breakthroughs, Sustainability, Discovery
- **Responsive design** — Works beautifully on mobile, tablet, and desktop

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (custom Placing Jade theme)
- **Anthropic API** (Claude Sonnet + web search)
- **File-based cache** (JSON, no database required)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and add your Anthropic API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
CACHE_DURATION_HOURS=3
```

Get your API key from [console.anthropic.com](https://console.anthropic.com/).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### Option A: Via GitHub (recommended)

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Placing Jade News"
   git remote add origin https://github.com/Soccolo/placing-jade-news.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.

3. Click **"Add New Project"** → import `placing-jade-news`.

4. In the **Environment Variables** section, add:
   - `ANTHROPIC_API_KEY` = your key
   - `CACHE_DURATION_HOURS` = `3`

5. Click **Deploy**. Done! You'll get a URL like `placing-jade-news.vercel.app`.

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel
# Follow the prompts, then set env vars:
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

### Custom Domain

In the Vercel dashboard → Settings → Domains, add your custom domain (e.g., `news.placingjade.com`). Point your DNS CNAME to `cname.vercel-dns.com`.

---

## Project Structure

```
placing-jade-news/
├── src/
│   ├── app/
│   │   ├── api/news/route.js    # Server-side API (keeps key secret)
│   │   ├── globals.css           # Tailwind + custom styles
│   │   ├── layout.js             # Root layout + metadata
│   │   └── page.js               # Main page orchestrator
│   ├── components/
│   │   ├── Header.jsx            # Logo, tagline, bookmarks toggle
│   │   ├── CategoryNav.jsx       # Category filter pills
│   │   ├── StoryOfTheDay.jsx     # Featured story card
│   │   ├── NewsCard.jsx          # Standard story card
│   │   ├── ShareMenu.jsx         # Social share dropdown
│   │   ├── LoadingSkeleton.jsx   # Loading state
│   │   └── Toast.jsx             # Notification toasts
│   └── lib/
│       ├── constants.js          # Categories, moods, queries
│       ├── cache.js              # File-based caching layer
│       └── adConfig.js           # Ad network configuration
├── .env.local.example
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## Cache Behaviour

- Stories are cached as JSON files in `.cache/` (one per category)
- Default TTL is 3 hours (configurable via `CACHE_DURATION_HOURS`)
- First request per category hits the Anthropic API (~15-25 seconds)
- Subsequent requests serve instantly from cache
- Cache auto-expires and refreshes on the next request

## Important Note on Vercel Caching

Vercel's serverless functions have an **ephemeral filesystem** — the `.cache/` directory resets on each cold start. For production, consider upgrading to:
- **Vercel KV** (Redis) for persistent caching
- **Upstash Redis** (free tier available)
- **A scheduled cron job** to pre-warm the cache

For a personal/low-traffic site, the file-based cache works well enough since Vercel keeps functions warm for several minutes between requests.

---

## Ad Monetisation

The site comes with ad infrastructure pre-built. Ads are disabled by default and render as subtle placeholder boxes so you can see where they'll appear.

### Ad Placements

| Placement | Location | Format |
|-----------|----------|--------|
| **Banner** | Between Story of the Day and the news grid | Horizontal leaderboard |
| **In-feed** | Inside the news grid (after 2nd card), styled as a card | Fluid / native |
| **Footer banner** | Above the site footer | Horizontal |

### Setting Up Google AdSense

1. Apply at [adsense.google.com](https://adsense.google.com) with your deployed site URL
2. Once approved, create ad units in AdSense → Ads → By ad unit:
   - One **Display ad** (horizontal) → copy the slot ID for banner and footer
   - One **In-feed ad** → copy the slot ID for the in-feed card
3. Edit `src/lib/adConfig.js`:
   - Set `ADS_ENABLED` to `true`
   - Replace `ADSENSE_PUBLISHER_ID` with your `ca-pub-XXXX` ID
   - Replace each `slotId` with the corresponding ad unit IDs
4. Edit `src/app/layout.js`:
   - Set `ADS_ENABLED` to `true`
   - Replace `ADSENSE_PUBLISHER_ID` with your `ca-pub-XXXX` ID
5. Redeploy

### Design Principles for Ads

The ad placements were designed with these principles:
- **Clearly labelled** — Every ad says "Supported by" or "Sponsored" so readers know
- **Non-intrusive** — No pop-ups, no interstitials, no auto-playing video
- **Contextually appropriate** — A positive news site attracts ethical/green advertisers
- **Graceful degradation** — If ads fail to load or are blocked, the layout stays clean

### Upgrading to Premium Ad Networks

Once you hit traffic milestones:
- **50k sessions/month** → Apply to [Mediavine](https://www.mediavine.com) (3-5x AdSense revenue)
- **100k sessions/month** → Apply to [Raptive](https://raptive.com) (formerly AdThrive)
- **Niche alternative** → [EthicalAds](https://www.ethicalads.io) or [Carbon Ads](https://www.carbonads.net) for sustainability-aligned advertisers

The `AdSlot` component is network-agnostic — swap the `<ins>` tag internals for any network's code.
