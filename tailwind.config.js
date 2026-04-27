/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cream: '#FAF6F0',
        ink: '#2A2723',
        sage: {
          50: '#F4F7F2',
          100: '#E5EBE0',
          200: '#CCD8C2',
          300: '#A8BD97',
          400: '#86A06F',
          500: '#6B8758',
          600: '#556E45',
          700: '#445838',
          800: '#37472E',
          900: '#2D3B27',
        },
        rose: {
          50: '#FBF3F1',
          100: '#F5E1DC',
          200: '#EBC2B9',
          300: '#DD9A8C',
          400: '#CC735F',
          500: '#B85A45',
        },
        butter: '#F4E4C1',
      },
    },
  },
  plugins: [],
}
