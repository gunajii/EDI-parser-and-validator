import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(220 13% 91%)",
        background: "hsl(220 20% 98%)",
        foreground: "hsl(222 47% 11%)",
        primary: "hsl(221 83% 53%)",
        muted: "hsl(220 15% 95%)",
      },
    },
  },
  plugins: [],
};

export default config;
