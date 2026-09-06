import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F6F2", // off-white cálido
        ink: "#1F1E1C", // negro suave
        stone: "#8A8578", // gris cálido
        "stone-light": "#E7E4DC",
        accent: "#4C5B58", // verde-slate apagado, único acento discreto
        "accent-soft": "#7C8A87",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(0.55)" },
          "40%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
