export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      aspectRatio: {
        'w-16': 16,
        'h-9': 9,
        'h-7': 7,
        'h-5': 5,
      },
      lineClamp: {
        2: '2',
      },
    },
  },
  plugins: [],
}