/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FFD700',
          accent: '#E5B80B',
          dark: '#0B0B0B',
        },
      },
    },
  },
  plugins: [],
};
