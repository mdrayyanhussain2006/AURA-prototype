/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,jsx}'],
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

