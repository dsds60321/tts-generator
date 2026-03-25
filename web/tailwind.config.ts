import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f5f5",
        panel: "#ffffff",
        ink: "#111111",
        accent: "#111111",
        accentSoft: "#f5f5f5",
        line: "#d4d4d8",
        success: "#111111",
        warning: "#3f3f46",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(17, 17, 17, 0.05), 0 10px 30px rgba(17, 17, 17, 0.04)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans KR", "SUIT Variable", "Noto Sans KR", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
