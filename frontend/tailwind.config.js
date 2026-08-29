/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080B14",
        card: {
          DEFAULT: "#151C2C",
          hover: "#1B2438",
          border: "rgba(148, 163, 184, 0.1)"
        },
        primary: {
          DEFAULT: "#22D3EE",
          hover: "#06B6D4",
          glow: "rgba(34, 211, 238, 0.15)"
        },
        foreground: "#F8FAFC",
        muted: "#94A3B8",
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#FB7185",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(34, 211, 238, 0.25)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}