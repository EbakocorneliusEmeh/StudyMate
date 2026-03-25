/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Ensure all your folders are covered
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require("nativewind/preset")],
  
  theme: {
    extend: {
      // 3. Add your StudyMate Branding here
      colors: {
        primary: '#7f13ec', // Purple
        accent: '#6366f1',  // Indigo
        surface: '#f8fafc', // Light gray
      },
      borderRadius: {
        'custom': '12px',   // Matches your HTML 'rounded-custom'
      }
    },
  },
  plugins: [],
};