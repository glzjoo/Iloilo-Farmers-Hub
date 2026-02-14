/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',  // use text-primary
        dark: '#1E1E1E',  // use text-dark
      },
      fontFamily: {
        heading: ['"Merriweather Sans"', 'sans-serif'], // use font-heading
        body: ['"Open Sans"', 'sans-serif'], // use font-body
      },
    },
  },
  plugins: [],
}
