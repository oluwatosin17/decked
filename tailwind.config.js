/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        anton: ['"Anton SC"', "sans-serif"],
        spicy: ['"Spicy Rice"', "cursive"],
        staatliches: ["Staatliches", "sans-serif"],
        slackey: ["Slackey", "cursive"],
        "single-day": ['"Single Day"', "cursive"],
        luckiest: ['"Luckiest Guy"', "cursive"],
        stick: ["Stick", "sans-serif"],
        gasoek: ['"Gasoek One"', "sans-serif"],
        freckle: ['"Freckle Face"', "cursive"],
        fredericka: ['"Fredericka the Great"', "serif"],
        satoshi: ["Satoshi", "sans-serif"],
        "inter-tight": ['"Inter Tight"', "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      keyframes: {
        starDrift: {
          "0%":   { transform: "translate(0px, 0px) scale(1.06)" },
          "20%":  { transform: "translate(-18px, -12px) scale(1.07)" },
          "40%":  { transform: "translate(-8px, -28px) scale(1.08)" },
          "60%":  { transform: "translate(14px, -20px) scale(1.07)" },
          "80%":  { transform: "translate(8px, -6px) scale(1.06)" },
          "100%": { transform: "translate(0px, 0px) scale(1.06)" },
        },
      },
      animation: {
        "star-drift": "starDrift 40s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
