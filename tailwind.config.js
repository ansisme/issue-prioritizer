/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        robotomono: ["Roboto Mono", "monospace"],
      },
      colors: {
        'titleColor': '#3294F8',
        'backgroundColor': '#071422',
        'profileColor': '#0B1B2B',
        'paragraphColor':'#AFC2D4',
        'headingColor' : '#E7EDF4',
        'inputColor' : '#040F1A',
        'subtitleColor' : '#C4D4E3',
        'labelColor': '#3A536B',
        'buttonColor': '#7B96B2',
        'borderColor': '#1C2F41',
      },
      scale: {
        flip: '-1',
      },
    },
  },
  plugins: [],
}

