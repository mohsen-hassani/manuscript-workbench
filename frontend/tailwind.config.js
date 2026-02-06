/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          900: '#0f1419',
          800: '#1a1f2e',
          700: '#242b3d',
          600: '#2e3650',
        },
        'accent': {
          purple: '#a78bfa',
          blue: '#60a5fa',
          pink: '#f472b6',
        }
      }
    },
  },
  plugins: [],
}
