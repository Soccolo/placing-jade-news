"use client";

import { useEffect, useRef, useState } from "react";
import { ADS_ENABLED, ADSENSE_PUBLISHER_ID } from "@/lib/adConfig";

/**
 * AdSlot — Renders a Google AdSense ad unit or a dev-mode placeholder.
 *
 * Props:
 * - slot: object from AD_SLOTS config ({ id, slotId, format, label })
 * - className: optional extra classes
 * - showPlaceholder: show a visual placeholder when ads are disabled (dev mode)
 *
 * When ADS_ENABLED is false, it renders a subtle dashed placeholder
 * so you can see where ads will appear in the layout.
 * When ADS_ENABLED is true, it renders the real AdSense <ins> tag.
 */
export default function AdSlot({ slot, className = "", showPlaceholder = true }) {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (ADS_ENABLED && adRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }
  }, []);

  if (!slot) return null;

  // Determine sizing based on format
  const formatStyles = {
    horizontal: "w-full min-h-[90px] max-h-[120px]",
    fluid: "w-full min-h-[250px]",
    vertical: "w-full min-h-[250px] max-w-[300px]",
  };

  const sizeClass = formatStyles[slot.format] || formatStyles.horizontal;

  // ── Dev placeholder (ads disabled) ──
  if (!ADS_ENABLED) {
    if (!showPlaceholder) return null;

    return (
      <div
        className={`${sizeClass} ${className}`}
        role="presentation"
        aria-hidden="true"
      >
        <div className="w-full h-full rounded-xl border-2 border-dashed border-jade-200/50 bg-jade-50/30 flex flex-col items-center justify-center gap-2 py-6">
          <span className="text-jade-300 text-xs font-body font-medium tracking-wide uppercase">
            {slot.label || "Ad Placement"}
          </span>
          <span className="text-jade-200 text-[0.65rem] font-body">
            {slot.format} · {slot.id}
          </span>
        </div>
      </div>
    );
  }

  // ── Live AdSense unit ──
  return (
    <div className={`${sizeClass} ${className} overflow-hidden`}>
      {/* Tasteful label above the ad */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-px flex-1 bg-jade-100" />
        <span className="text-[0.6rem] text-jade-300 font-body font-medium tracking-widest uppercase">
          {slot.label || "Sponsored"}
        </span>
        <div className="h-px flex-1 bg-jade-100" />
      </div>

      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot.slotId}
        data-ad-format={slot.format === "fluid" ? "fluid" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
