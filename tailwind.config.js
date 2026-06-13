/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          50: "#f0f5fb",
          100: "#dce7f5",
          200: "#b8cfee",
          300: "#87afe3",
          400: "#4f87d3",
          500: "#2a66be",
          600: "#1e4f9c",
          700: "#193f7d",
          800: "#163263",
          900: "#0f1f3d",
          950: "#0a1428",
        },
        amber: {
          50: "#fff8ec",
          100: "#ffedd3",
          200: "#ffd7a5",
          300: "#ffba6d",
          400: "#ff9533",
          500: "#ff7a0f",
          600: "#f05d05",
          700: "#c74507",
          800: "#9e370e",
          900: "#7f2f0f",
          950: "#451505",
        },
        jade: {
          50: "#eefbf4",
          100: "#d5f5e3",
          200: "#aeeacb",
          300: "#77d7a8",
          400: "#42bd83",
          500: "#1fa268",
          600: "#138252",
          700: "#116844",
          800: "#115338",
          900: "#0f4530",
          950: "#07261a",
        },
        crimson: {
          50: "#fdf2f4",
          100: "#fce6ea",
          200: "#f9d0d9",
          300: "#f4a9ba",
          400: "#ec7591",
          500: "#e04a6e",
          600: "#cc2c54",
          700: "#ab1f44",
          800: "#8f1d3e",
          900: "#781d39",
          950: "#430b1c",
        },
        ink: {
          50: "#f7f7f8",
          100: "#eeeeef",
          200: "#d9dadc",
          300: "#b8babf",
          400: "#91949c",
          500: "#747782",
          600: "#5d5f6a",
          700: "#4b4d55",
          800: "#393a41",
          900: "#202126",
          950: "#0f1013",
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"PingFang SC"', "serif"],
        sans: ['"Noto Sans SC"', '"PingFang SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 30px -5px rgba(42, 102, 190, 0.3)",
        "glow-amber": "0 0 30px -5px rgba(255, 122, 15, 0.4)",
        "glow-jade": "0 0 30px -5px rgba(31, 162, 104, 0.4)",
        "glow-crimson": "0 0 30px -5px rgba(224, 74, 110, 0.4)",
        card: "0 4px 24px -4px rgba(15, 31, 61, 0.08)",
      },
      backgroundImage: {
        "grid-slate":
          "linear-gradient(rgba(148,163,184,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.07) 1px,transparent 1px)",
        "radial-navy":
          "radial-gradient(ellipse at top,rgba(42,102,190,0.15),transparent 60%)",
        "radial-amber":
          "radial-gradient(ellipse at bottom right,rgba(255,122,15,0.12),transparent 60%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out both",
        "fade-in": "fadeIn 0.5s ease-out both",
        shimmer: "shimmer 2s linear infinite",
        "slide-in-right": "slideInRight 0.4s ease-out both",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
