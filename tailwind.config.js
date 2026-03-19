/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F97316', // Orange CTAs
          secondary: '#7F1D1D', // Deep Red Background
          background: '#FDF8F0', // Cream Background
          surface: '#FFFFFF', // White Cards
          disabled: '#B88B93', // Muted Mauve
          textMain: '#291811', // Deep Brown text
          textMuted: '#6B5E59', // Muted Brown text
          border: '#E5DFD7',
        },
      },
      spacing: {
        // Enforcing 4pt grid system implicitly by using Tailwind's default which is based on 0.25rem (4px)
        // 1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 5 = 20px, 6 = 24px, 8 = 32px, etc.
        18: '72px',
        22: '88px',
      },
      fontFamily: {
        // Mapping typical system font weights to distinct names for clearer UI definitions
        sans: ['System'],
        serif: ['System'],
      },
    },
  },
  plugins: [require('nativewind/tailwind/native')],
};
