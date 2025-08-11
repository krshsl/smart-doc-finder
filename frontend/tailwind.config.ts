import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e"
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a"
        }
      },
      keyframes: {
        sparkleMove: {
          "0%, 100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: "0.8"
          },
          "50%": {
            transform: "scale(1.25) rotate(15deg)",
            opacity: "1"
          }
        }
      },
      animation: {
        sparkle: "sparkleMove 1.5s infinite ease-in-out"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
