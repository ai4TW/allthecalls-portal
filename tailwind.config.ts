import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#08090f",
          panel: "#0f1119",
          card: "#141725",
          edge: "#1f2233",
        },
        ink: {
          DEFAULT: "#e8eaf2",
          dim: "#9aa0b8",
          mute: "#5d6378",
        },
        accent: {
          violet: "#8b5cf6",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
