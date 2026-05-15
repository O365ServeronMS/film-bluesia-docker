import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      colors: {
        base: "#07090f",
        panel: "#11131c",
        card: "#181a24",
        gold: "#ffd22e"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(255, 210, 46, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
