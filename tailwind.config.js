/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.edge",
    "./resources/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    colors: {
      primary: '#0E0E0E',
      secondary: 'rgb(255, 100, 0)',
      danger: '#ef4444',
      mid:'#00A700',
      black: '#000',
      white: '#fff',
    },
  },
  plugins: [],
}