import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B3A6B",
          50: "#EEF2F9",
          100: "#D6E0F0",
          200: "#ADBFDF",
          300: "#849ECE",
          400: "#5B7DBE",
          500: "#2E5A9A",
          600: "#1B3A6B",
          700: "#162F58",
          800: "#112446",
          900: "#0C1934",
        },
        teal: {
          DEFAULT: "#0D7E8A",
          50: "#E6F5F6",
          100: "#C0E8EB",
          200: "#8DD5DA",
          300: "#5AC1C9",
          400: "#10949F",
          500: "#0D7E8A",
          600: "#0A6974",
          700: "#085560",
          800: "#06404A",
          900: "#042C34",
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(27,58,107,0.04)',
        'card-hover': '0 4px 12px rgba(27,58,107,0.06), 0 1px 3px rgba(27,58,107,0.04)',
        'elevated': '0 8px 24px rgba(27,58,107,0.08), 0 2px 8px rgba(27,58,107,0.04)',
        'overlay': '0 16px 48px rgba(27,58,107,0.10), 0 4px 12px rgba(27,58,107,0.06)',
        'sidebar': '4px 0 24px rgba(27,58,107,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.75)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
