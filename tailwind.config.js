/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./public/**/*.html", "./public/**/*.js", "./src/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        background: "var(--color-background)",
        text1: "var(--color-text-1)",
        text2: "var(--color-text-2)",
        text3: "var(--color-text-3)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
