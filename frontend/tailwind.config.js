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
          bg: '#0a0d16',        // Lighter, richer dark slate background
          card: 'rgba(30, 41, 59, 0.55)', // Brighter, more solid glass card backdrop
          primary: '#00e5ff',   // Vibrant Neon Cyan
          primaryGlow: 'rgba(0, 229, 255, 0.35)',
          success: '#05ffb0',   // Vibrant Neon Emerald
          successGlow: 'rgba(5, 255, 176, 0.35)',
          warning: '#ffbb00',   // Lighter Gold / Orange warning
          warningGlow: 'rgba(255, 187, 0, 0.35)',
          danger: '#ff1a8c',    // Brighter Electric Rose
          dangerGlow: 'rgba(255, 26, 140, 0.35)',
          text: '#ffffff',      // Crisp pure white text
          muted: '#cbd5e1'      // Brighter Slate 300 for high-contrast reading
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
