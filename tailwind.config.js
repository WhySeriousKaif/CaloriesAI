/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Calora brand — the logo gradient runs brand → brand-deep
        brand: {
          DEFAULT: '#22c55e',
          deep: '#0f766e',
        },
        wordmark: '#0f5132',
        // Surfaces: warm off-white in light, charcoal in dark
        surface: {
          DEFAULT: '#faf9f7',
          dark: '#111315',
        },
      },
    },
  },
  plugins: [],
};
