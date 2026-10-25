/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8eb',
          100: '#ffecd1',
          500: '#F59E0B',
          600: '#D97706',
        },
        dark: '#333333',
        grayish: '#888888',
      },
    },
  },
  plugins: [],
}