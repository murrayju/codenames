const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spy: {
          black: colors.zinc[900],
          blue: colors.blue[800],
          red: colors.red[800],
        },
      },
    },
  },
  plugins: [],
};
