import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#1B3A6B", 50: "#EEF2F9", 100: "#D6E0F0", 600: "#1B3A6B", 700: "#162F58", 800: "#112446" },
        teal: { DEFAULT: "#0D7E8A", 50: "#E6F5F6", 100: "#C0E8EB", 500: "#0D7E8A", 600: "#0A6974", 700: "#085560" },
      }
    }
  },
  plugins: [],
};
export default config;
