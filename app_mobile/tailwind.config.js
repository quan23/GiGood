/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Mirrors constants/theme.ts `colors` (purely additive; the default
      // Tailwind palette used by existing screens stays untouched).
      colors: {
        brand: {
          orange: "#ea580c",
          orangeHover: "#c2410c",
          orangeSoft: "#fff7ed",
          orangeLight: "#ffedd5",
          orangeBorder: "#fdba74",
          teal: "#0f766e",
          tealHover: "#115e59",
          tealLight: "#f0fdfa",
          tealSoft: "#99f6e4",
          stoneDark: "#1c1917",
          stoneLight: "#fafaf9",
          stoneBorder: "#e7e5e4",
          white: "#ffffff",
          grayIcon: "#6b7280",
          grayMuted: "#9ca3af",
          grayDisabled: "#d1d5db",
          grayTrack: "#f4f3f4",
          amber: "#f59e0b",
          red: "#ef4444",
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
