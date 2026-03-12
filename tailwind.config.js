import nativewind from "nativewind/preset";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  presets: [nativewind],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;