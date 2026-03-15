/**
 * Ad Configuration for Placing Jade
 *
 * HOW TO SET UP:
 * 1. Apply for Google AdSense at https://adsense.google.com
 * 2. Once approved, replace the placeholder values below with your real IDs
 * 3. Set ADS_ENABLED to true
 * 4. Redeploy
 *
 * Ad placements are designed to be tasteful and non-intrusive,
 * matching the positive tone of the site.
 */

// Master switch — set to true when your ad network is approved
export const ADS_ENABLED = false;

// Google AdSense publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)
export const ADSENSE_PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";

// Individual ad slot IDs from your AdSense dashboard
// Create these in AdSense → Ads → By ad unit → Display ads
export const AD_SLOTS = {
  // Horizontal banner between Story of the Day and the grid
  banner: {
    id: "banner-mid",
    slotId: "XXXXXXXXXX", // Replace with your AdSense ad unit ID
    format: "horizontal", // leaderboard / banner
    label: "Supported by",
  },

  // Card-shaped ad that blends into the news grid
  inFeed: {
    id: "in-feed",
    slotId: "XXXXXXXXXX",
    format: "fluid", // responsive in-feed
    label: "Sponsored",
  },

  // Sidebar ad for wider viewports (shown on desktop only)
  sidebar: {
    id: "sidebar",
    slotId: "XXXXXXXXXX",
    format: "vertical",
    label: "From our partners",
  },

  // Footer banner above the site footer
  footerBanner: {
    id: "footer-banner",
    slotId: "XXXXXXXXXX",
    format: "horizontal",
    label: "Supported by",
  },
};

/**
 * Ad placement strategy:
 *
 * ┌─────────────────────────────────────┐
 * │  Header                             │
 * │  Category Nav                       │
 * ├─────────────────────────────────────┤
 * │  Story of the Day                   │
 * ├─────────────────────────────────────┤
 * │  ░░░░ Banner Ad (banner) ░░░░░░░░  │  ← Horizontal, clearly labelled
 * ├──────────────────┬──────────────────┤
 * │  News Card       │  News Card       │
 * │  News Card       │  Sponsored Card  │  ← In-feed ad styled as a card
 * │  News Card       │  News Card       │
 * ├──────────────────┴──────────────────┤
 * │  ░░░░ Footer Banner ░░░░░░░░░░░░░  │  ← Before footer, subtle
 * ├─────────────────────────────────────┤
 * │  Footer                             │
 * └─────────────────────────────────────┘
 */
