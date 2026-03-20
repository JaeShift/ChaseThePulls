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
        background: "#080C14",
        surface: "#0E1520",
        surface2: "#131C2E",
        "surface-border": "#1A2540",
        gold: "#FFD700",
        "gold-light": "#FFE44D",
        "gold-dark": "#CC9900",
        "electric-red": "#FF3B3B",
        "electric-cyan": "#00D4FF",
        "electric-purple": "#8B5CF6",
        "electric-green": "#10B981",
        "electric-pink": "#EC4899",
      },
      fontFamily: {
        display: ["var(--font-rajdhani)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 3s ease infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        aurora: "aurora 12s ease infinite",
        "spin-slow": "spin 20s linear infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "particle-float": "particle-float 8s ease-in-out infinite",
        "energy-pulse": "energy-pulse 3s ease-in-out infinite",
        "text-shimmer": "text-shimmer 3s ease-in-out infinite",
        "scale-in": "scale-in 0.2s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-15px) rotate(2deg)" },
          "66%": { transform: "translateY(-8px) rotate(-1deg)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 60px rgba(255, 215, 0, 0.7), 0 0 100px rgba(255, 215, 0, 0.3)",
          },
        },
        aurora: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "particle-float": {
          "0%": { transform: "translateY(100vh) scale(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "0.7" },
          "100%": { transform: "translateY(-20px) scale(1)", opacity: "0" },
        },
        "energy-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
        "text-shimmer": {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        holographic:
          "linear-gradient(135deg, #ff0080, #ff8c00, #ffd700, #00ff80, #00ffff, #8000ff, #ff0080)",
        "hero-gradient":
          "radial-gradient(ellipse at top, #0F1A35 0%, #080C14 50%, #0A0E1A 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(0,212,255,0.05) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
