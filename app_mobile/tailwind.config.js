/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ea580c",
          orangeHover: "#c2410c",
          orangeLight: "#ffedd5",
          teal: "#0f766e",
          tealHover: "#115e59",
          tealLight: "#f0fdfa",
          stoneDark: "#1c1917",
          stoneLight: "#fafaf9",
          stoneBorder: "#e7e5e4",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
