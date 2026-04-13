/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: ' #172E03',  // use text-primary
        dark: '#1E1E1E',  // use text-dark
        secondary: '#68B629',
      },
      fontFamily: {
        heading: ['"Coolvetica"', 'sans-serif'], // use font-heading
        body: ['"Open Sans"', 'sans-serif'], // use font-body
      },
    },
  },
  plugins: [],
}
