/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3b6ef5',
          600: '#2856db',
          700: '#1f43b0',
        },
        status: {
          todo: '#fef3c7',
          'todo-text': '#92400e',
          doing: '#dbeafe',
          'doing-text': '#1e40af',
          done: '#d1fae5',
          'done-text': '#065f46',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
