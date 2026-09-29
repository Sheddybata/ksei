import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#123B5D",
          deep: "#0C2A43",
          mid: "#1C527D",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#E6D7A2",
          deep: "#8C7014",
        },
        teal: {
          DEFAULT: "#168C87",
          deep: "#0E6763",
          soft: "#D5EDEC",
        },
        charcoal: "#252525",
        ivory: {
          DEFAULT: "#F7F3E8",
          deep: "#EFE8D6",
        },
        paper: "#FFFCF7",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 24px 60px -28px rgba(18, 59, 93, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
