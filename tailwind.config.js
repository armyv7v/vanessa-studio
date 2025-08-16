/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rosa principal con gradientes
        primary: {
          50: "#fff5f8",
          100: "#ffe0ea",
          200: "#ffbcd5",
          300: "#ff94bf",
          400: "#ff6ea9",
          500: "#ff4b93", // base
          600: "#e64384",
          700: "#b6326b",
          800: "#86204f",
          900: "#5b1136",
        },
      },
      backgroundImage: theme => ({
        "gradient-primary": "linear-gradient(135deg, #ff4b93 0%, #ff6ea9 100%)",
      }),
    },
  },
  plugins: [],
};