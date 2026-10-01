import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{html,js,svelte,ts}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Nocturne palette
        night: {
          950: "#04060D",
          900: "#070A14",
          850: "#090D19",
          800: "#0C1120",
          700: "#111729",
          600: "#161D33",
          500: "#222B47",
        },
        moon: {
          DEFAULT: "#C7D2FE",
          bright: "#EEF1FF",
          deep: "#A5B4FC",
        },
        star: {
          DEFAULT: "#E8ECF8",
          2: "#B9C1D9",
          muted: "#8A93AD",
          dim: "#7883A4",
          faint: "#4E5878",
        },
        gold: "#F2D48A",
        aurora: "#7DD3C0",
        ember: "#F29B9B",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.95" },
        },
        wax: {
          "0%": { transform: "translateX(-8%)" },
          "100%": { transform: "translateX(92%)" },
        },
        "caret-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0" },
        },
        "moon-breathe": {
          "0%, 100%": { opacity: "0.65", transform: "scale(0.97)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        twinkle: "twinkle 4s ease-in-out infinite",
        wax: "wax 2.4s ease-in-out infinite alternate",
        "caret-blink": "caret-blink 1.1s steps(1) infinite",
        scan: "scan 2.2s ease-in-out infinite",
        "moon-breathe": "moon-breathe 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
