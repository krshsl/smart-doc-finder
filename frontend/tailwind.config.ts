import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
  plugins: []
};

export default config;
