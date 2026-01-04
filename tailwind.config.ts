import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        'charcoal-plum': '#1E1A22',
        'smoked-rosewood': '#6B3A3A',
        'candle-amber': '#E1B382',
        // Secondary palette
        'forest-shadow': '#2F3A32',
        'moonstone-gray': '#C8C6CC',
      },
      backgroundColor: {
        'glass': 'rgba(30, 26, 34, 0.55)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'glow-amber': '0 0 24px rgba(225, 179, 130, 0.15)',
        'glow-amber-strong': '0 0 32px rgba(225, 179, 130, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
