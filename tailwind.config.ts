import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f8fafc",
        court: "#2ed573",
        paddle: "#ff4d6d",
        gold: "#facc15",
        night: "#101116",
        graphite: "#191b24",
        line: "#2a2d3a",
        mist: "#aab3c2"
      },
      boxShadow: {
        panel: "0 24px 70px rgba(0, 0, 0, 0.34)",
        glow: "0 0 0 1px rgba(46, 213, 115, 0.24), 0 18px 48px rgba(46, 213, 115, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
