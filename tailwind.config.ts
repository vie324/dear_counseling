import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FCE4EC",
          100: "#F8BBD0",
          200: "#F48FB1",
          300: "#F06292",
          400: "#EC407A",
          500: "#E91E63",
          600: "#D81B60",
          700: "#C2185B",   // メインカラー（紙シートのピンク）
          800: "#AD1457",
          900: "#880E4F",
        },
      },
      fontFamily: {
        sans: ['"Hiragino Sans"', '"Yu Gothic"', '"Noto Sans JP"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
