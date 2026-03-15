import "./globals.css";
import Script from "next/script";

// Only loads the AdSense script when ads are enabled
const ADS_ENABLED = false; // Mirror this from adConfig — or use env var
const ADSENSE_PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";

export const metadata = {
  title: "Placing Jade — Good News for the World",
  description:
    "Uplifting stories of conservation, medical breakthroughs, sustainability, and scientific discovery — curated by AI.",
  openGraph: {
    title: "Placing Jade — Good News for the World",
    description:
      "Uplifting stories of conservation, medical breakthroughs, sustainability, and discovery.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="grain-overlay">
        {children}
        {ADS_ENABLED && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
