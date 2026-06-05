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
          bg: 'var(--color-bg)',        // CSS Variable
          card: 'var(--color-card)',    // CSS Variable
          primary: 'var(--color-primary)', // CSS Variable
          primaryGlow: 'var(--color-primary-glow)',
          success: 'var(--color-success)', // CSS Variable
          successGlow: 'var(--color-success-glow)',
          warning: 'var(--color-warning)', // CSS Variable
          warningGlow: 'var(--color-warning-glow)',
          danger: 'var(--color-danger)',   // CSS Variable
          dangerGlow: 'var(--color-danger-glow)',
          text: 'var(--color-text)',       // CSS Variable
          muted: 'var(--color-muted)'      // CSS Variable
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
