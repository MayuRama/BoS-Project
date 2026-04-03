/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bos-green': '#6ab04c',
        'bos-navy': '#1a2744',
        'bos-slate': '#1e293b',
        'bos-blue': '#1e40af',
      },
    },
  },
  plugins: [],
}
