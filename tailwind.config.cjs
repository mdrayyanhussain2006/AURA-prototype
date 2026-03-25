/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,jsx,ts,tsx}', './src/features/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aura: {
          bg: '#fbe4d8',
          panel: '#190019',
          accent: '#854f6c',
          accentSoft: '#522b5b',
          border: '#dfb6b2'
        }
      }
    }
  },
  plugins: []
};

