import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        leaf: { 50: "#f2f9ef", 100: "#e2f1dc", 500: "#4f9d54", 600: "#347a3a", 700: "#285f2d", 900: "#15391b" },
        earth: "#7b593d",
        cream: "#fbfaf6"
      },
      boxShadow: { soft: "0 10px 30px rgba(32, 75, 39, 0.09)" }
    }
  },
  plugins: []
};

export default config;
