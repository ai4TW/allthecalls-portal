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
        // Exact AllTheCalls.ai brand colors
        accent: {
          cyan: "#4cd7f6",
          cyanDeep: "#06b6d4",
          violet: "#7c3aed",
          violetSoft: "#a78bfa",
          violetLight: "#c4b5fd",
          violetMist: "#d2bbff",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "atc-gradient":
          "linear-gradient(135deg, #4cd7f6 0%, #7c3aed 55%, #c4b5fd 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
