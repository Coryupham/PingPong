import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        court: "#1f9d8a",
        paddle: "#ef4444",
        gold: "#f59e0b"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
