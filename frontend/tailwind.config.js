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
          bg: '#0f172a',        // Deep dark slate
          card: '#1e293b',      // Slightly lighter slate for cards
          primary: '#38bdf8',   // Light blue accent
          success: '#10b981',   // Green for income/positive
          warning: '#f59e0b',   // Yellow/orange for alerts
          danger: '#ef4444',    // Red for expenses/debts
          text: '#f8fafc',      // Off-white text
          muted: '#94a3b8'      // Grayed-out text
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
