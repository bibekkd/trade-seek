/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0D10",
        secondary: {
          DEFAULT: "#11151C",
          foreground: "#98A2B3",
        },
        card: {
          DEFAULT: "#171B22",
          hover: "#1F2631",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#98A2B3",
        },
        accent: {
          DEFAULT: "#B8D957", // Accent Green
          green: "#B8D957",
          blue: "#66A7FF",
          purple: "#8D63FF",
        },
        success: "#22C55E",
        error: "#FF5C5C",
        border: "rgba(255, 255, 255, 0.06)",
      },
      borderRadius: {
        sm: "12px",
        input: "18px",
        card: "24px",
        large: "28px",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["GeistMono", "JetBrains Mono", "SF Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 3s infinite ease-in-out",
        "float-slow": "float-slow 6s infinite ease-in-out",
        "grid-move": "grid-move 20s linear infinite",
        "aurora": "aurora 15s ease infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "grid-move": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 40px" },
        },
        "aurora": {
          "0%, 100%": { opacity: "0.5", transform: "rotate(0deg) scale(1)" },
          "50%": { opacity: "0.8", transform: "rotate(180deg) scale(1.1)" },
        },
      },
      boxShadow: {
        subtle: "0 8px 30px rgba(0, 0, 0, 0.18)",
        glow: "0 0 40px rgba(184, 217, 87, 0.15)",
        "glow-purple": "0 0 40px rgba(141, 99, 255, 0.2)",
        "glow-blue": "0 0 40px rgba(102, 167, 255, 0.2)",
      },
      spacing: {
        4: "4px",
        8: "8px",
        12: "12px",
        16: "16px",
        20: "20px",
        24: "24px",
        32: "32px",
        40: "40px",
        48: "48px",
        64: "64px",
        80: "80px",
        96: "96px",
      },
    },
  },
  plugins: [],
};


