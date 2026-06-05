/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#05070c',        // O'ta to'q ko'k / qora fon
          card: 'rgba(13, 19, 33, 0.45)', // Shaffof glass-card asosi
          primary: '#00e5ff',   // Neon Cyan
          primaryGlow: 'rgba(0, 229, 255, 0.25)',
          success: '#05ffb0',   // Neon Emerald yashil
          successGlow: 'rgba(5, 255, 176, 0.25)',
          warning: '#ffaa00',   // Oltin rang / ogohlantirish
          warningGlow: 'rgba(255, 170, 0, 0.25)',
          danger: '#ff007f',    // Pushti-qizil / Electric Rose
          dangerGlow: 'rgba(255, 0, 127, 0.25)',
          text: '#f8fafc',      // Oqish matn
          muted: '#8f9cae'      // Kulrang matn
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
