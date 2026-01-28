/** @type {import('tailwindcss').Config} */
export default {
  // Esta configuración busca en TODAS las carpetas y subcarpetas
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}