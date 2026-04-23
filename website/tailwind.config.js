/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FFD700', // Qadsiah yellow
          dark: '#0B0B0B',
          gold: '#D4AF37',
          accent: '#E5B80B',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(255,215,0,0.25)',
      },
    },
  },
  plugins: [],
};
