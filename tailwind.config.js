/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        jade: {
          50: "#f0f7f2",
          100: "#dceee1",
          200: "#baddc5",
          300: "#8cc5a0",
          400: "#5da878",
          500: "#4a7c59",
          600: "#316b45",
          700: "#2a5639",
          800: "#24452f",
          900: "#1a2e1a",
        },
        sand: {
          50: "#faf8f5",
          100: "#f5f0ea",
          200: "#ebe0d2",
          300: "#dccbb2",
          400: "#c7ac88",
          500: "#9b7653",
        },
        ocean: {
          50: "#eef3f8",
          100: "#d5e3f0",
          200: "#afc9e2",
          300: "#7faacf",
          400: "#5a8dba",
          500: "#457b9d",
        },
        warmth: {
          50: "#fef4ee",
          100: "#fde6d5",
          200: "#fac9a8",
          300: "#f5a673",
          400: "#e88545",
          500: "#c77b4a",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "float": "float 4s ease-in-out infinite",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(24px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(2deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.5 },
          "50%": { opacity: 0.8 },
        },
      },
    },
  },
  plugins: [],
};
