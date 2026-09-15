import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f9f8f5",
        leaf: {
          50:  "#f2f8f2",
          100: "#e2f0e2",
          200: "#c3e0c3",
          300: "#96c996",
          400: "#5fad5f",
          500: "#3d8f3d",
          600: "#2e7230",
          700: "#245b26",
          800: "#1c4620",
          900: "#133219",
          950: "#0a1f0f",
        },
        earth: {
          50:  "#faf6f1",
          100: "#f3e9db",
          200: "#e5ceb0",
          300: "#d4ae82",
          400: "#c08d59",
          500: "#a97140",
          600: "#8c5a31",
          700: "#6f4527",
          800: "#573521",
          900: "#3f2717",
        },
        amber: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        sm:     "0 1px 2px 0 rgba(0,0,0,0.05)",
        DEFAULT:"0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)",
        md:     "0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)",
        lg:     "0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)",
        soft:   "0 2px 12px 0 rgba(27,77,33,0.06)",
        card:   "0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      spacing: {
        "18": "4.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
