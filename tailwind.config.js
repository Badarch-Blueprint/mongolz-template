/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  important: true,
  theme: {
    extend: {
      colors: {
        primary: '#EFC567',
        black: '#050404'
      },
      fontFamily: {
        'montserat': ['Montserrat', 'sans-serif'],
        'comfortaa': [ 'Comfortaa', 'sans-serif' ]
      }
    },
  },
  plugins: [],
}

