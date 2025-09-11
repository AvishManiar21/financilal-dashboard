/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'primary': '#003f5c',
        'secondary': '#0070c0',
        'accent': '#ffa600',
        'kpi-1': '#ff6361',
        'kpi-2': '#bc5090',
        'kpi-3': '#58508d',
        'kpi-4': '#ffa600',
        'kpi-5': '#0070c0',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'spin': 'spin 1s ease infinite',
      },
      gridTemplateColumns: {
        'auto-fit-200': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-250': 'repeat(auto-fit, minmax(250px, 1fr))',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
