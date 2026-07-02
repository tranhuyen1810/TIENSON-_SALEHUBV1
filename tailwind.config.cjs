module.exports = {
  content: ["./src/renderer/index.html", "./src/renderer/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          700: "#0369a1"
        }
      }
    }
  },
  plugins: []
};
