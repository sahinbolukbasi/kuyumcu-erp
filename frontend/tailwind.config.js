/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#d4af37",
          700: "#b38b14",
          800: "#854d0e",
          900: "#554300"
        },
        surface: {
          dark: "#0b0c10",
          darkcard: "#12141c",
          darkcardhigh: "#191c26",
          light: "#f7f7f4",
          lightcard: "#ffffff",
          lightborder: "#e7dfcd"
        }
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        display: ["Playfair Display", "serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
};
