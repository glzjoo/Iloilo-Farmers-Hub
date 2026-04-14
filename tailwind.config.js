/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          black: '#000000',
          900: '#1A1A1A',
          500: '#6B6B6B',
          300: '#D4D4D4',
          100: '#F5F5F5',
          white: '#FFFFFF',
        },

        primary: '#172E03',
        secondary: '#68B629',
        accent: '#E9FADB',
      },

      fontFamily: {
        primary: ['"Coolvetica"', 'sans-serif'],
        secondary: ['"Inter"', 'sans-serif'],
        heading: ['"Coolvetica"', 'sans-serif'],
      },

    },
  },
  plugins: [],
}

