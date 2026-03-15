export const CATEGORIES = [
  { id: "all", label: "All Stories", icon: "✦", color: "#4a7c59" },
  { id: "conservation", label: "Conservation", icon: "🌿", color: "#2d6a4f" },
  { id: "medical", label: "Medical Breakthroughs", icon: "🧬", color: "#457b9d" },
  { id: "sustainability", label: "Sustainability", icon: "♻️", color: "#6b8f71" },
  { id: "discovery", label: "Discovery", icon: "🔭", color: "#9b7653" },
];

export const CATEGORY_QUERIES = {
  all: "positive news sustainability conservation medical breakthroughs species recovery",
  conservation:
    "positive conservation news animals rescued species recovery endangered species saved wildlife protection",
  medical:
    "medical breakthroughs positive health discoveries new treatments cures disease prevention",
  sustainability:
    "sustainability good news renewable energy climate solutions clean technology green innovation",
  discovery:
    "new species discovered scientific discovery nature new plants ocean discovery archaeology",
};

export const MOOD_CONFIG = {
  hopeful: {
    bg: "bg-jade-50",
    accent: "#4a7c59",
    accentClass: "text-jade-500",
    emoji: "🌱",
    label: "Hopeful",
  },
  inspiring: {
    bg: "bg-ocean-50",
    accent: "#457b9d",
    accentClass: "text-ocean-500",
    emoji: "⭐",
    label: "Inspiring",
  },
  breakthrough: {
    bg: "bg-sand-100",
    accent: "#9b7653",
    accentClass: "text-sand-500",
    emoji: "🔬",
    label: "Breakthrough",
  },
  heartwarming: {
    bg: "bg-warmth-50",
    accent: "#c77b4a",
    accentClass: "text-warmth-500",
    emoji: "💛",
    label: "Heartwarming",
  },
};
