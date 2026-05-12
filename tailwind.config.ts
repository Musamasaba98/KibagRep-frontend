/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
     colors:{
      primary:"#2563eb",
     },
     fontFamily:{
      'poppins':["poppins","sans-serif"],
      'poppins-semibold':["poppins-semibold","sans-serif"],
      'poppins-bold':["poppins-bold","sans-serif"],
      'poppins-extrabold':["poppins-extrabold","sans-serif"],
     }
    },
  },
  plugins: [],
};
