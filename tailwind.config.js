/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'retro-dark': '#0a0a0a',
        'retro-green': '#7fff7f',
        'retro-amber': '#ffcc00',
        'retro-card': '#111111',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
