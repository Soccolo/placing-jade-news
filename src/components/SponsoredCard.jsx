"use client";

import { useEffect, useRef, useState } from "react";
import { ADS_ENABLED, ADSENSE_PUBLISHER_ID, AD_SLOTS } from "@/lib/adConfig";

/**
 * SponsoredCard — An ad unit designed to sit naturally in the news grid.
 *
 * Matches the visual styling of NewsCard but is clearly labelled "Sponsored"
 * to maintain reader trust. Renders a fluid AdSense unit inside a card shell,
 * or a placeholder in dev mode.
 */
export default function SponsoredCard({ index = 0, showPlaceholder = true }) {
  const adRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const slot = AD_SLOTS.inFeed;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100 + 100);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (ADS_ENABLED && adRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("In-feed ad error:", e);
      }
    }
  }, []);

  if (!ADS_ENABLED && !showPlaceholder) return null;

  return (
    <div
      className="rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-500 ease-out border border-jade-100/40 bg-gradient-to-br from-jade-50/40 to-sand-50/30"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {/* Sponsored label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-jade-100/60 text-jade-400 text-[0.65rem] font-bold tracking-wider uppercase font-body">
          Sponsored
        </div>
      </div>

      {ADS_ENABLED ? (
        /* Real ad */
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", minHeight: "200px" }}
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={slot.slotId}
          data-ad-format="fluid"
          data-ad-layout-key="-gw-3+1f-3d+2z" /* in-feed layout key */
        />
      ) : (
        /* Dev placeholder */
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="text-3xl opacity-30">📢</div>
          <span className="text-jade-300 text-xs font-body font-medium">
            In-feed ad unit
          </span>
          <span className="text-jade-200 text-[0.6rem] font-body">
            Blends with story cards
          </span>
        </div>
      )}
    </div>
  );
}
