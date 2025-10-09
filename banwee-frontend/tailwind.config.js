export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'main': '#253d4e',
        'primary': '#61b482',
        'primary-light': '#8fd4a5',
        'primary-dark': '#4c9066',
        'secondary': '#f2c94c',
        'background': '#f5f5f5',
        'surface': '#ffffff',
      },
      fontFamily: {
        'sans': ['Montserrat', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}