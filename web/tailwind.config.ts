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
        canvas: "#edf2f7",
        canvasAlt: "#e7edf4",
        panel: "#ffffff",
        panelMuted: "#f6f8fb",
        ink: "#101828",
        muted: "#475467",
        subtle: "#667085",
        accent: "#1d2939",
        accentSoft: "#e8eef5",
        line: "#d7dee7",
        lineStrong: "#bfc9d5",
        success: "#067647",
        successSoft: "#ecfdf3",
        warning: "#b54708",
        warningSoft: "#fffaeb",
        danger: "#b42318",
        dangerSoft: "#fef3f2",
        info: "#175cd3",
        infoSoft: "#eff8ff",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 24, 40, 0.05), 0 14px 40px rgba(15, 23, 42, 0.08)",
        float: "0 18px 44px rgba(15, 23, 42, 0.12)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans KR", "SUIT Variable", "Noto Sans KR", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
