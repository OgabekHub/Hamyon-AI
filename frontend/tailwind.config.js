/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg:           'var(--color-bg)',
          card:         'var(--color-card)',
          primary:      'var(--color-primary)',
          primaryAlt:   'var(--color-primary-alt)',
          primaryGlow:  'var(--color-primary-glow)',
          primaryDeep:  'var(--color-primary-deep)',
          success:      'var(--color-success)',
          successGlow:  'var(--color-success-glow)',
          warning:      'var(--color-warning)',
          warningGlow:  'var(--color-warning-glow)',
          danger:       'var(--color-danger)',
          dangerGlow:   'var(--color-danger-glow)',
          text:         'var(--color-text)',
          muted:        'var(--color-muted)',
          accent:       'var(--color-accent)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #0d1b4b 0%, #1a3580 40%, #1e63f5 100%)',
        'blue-gradient':  'linear-gradient(135deg, #1e63f5 0%, #3b9ef8 100%)',
        'hero-radial':    'radial-gradient(ellipse at 20% 0%, #0d1630 0%, #040810 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(30, 99, 245, 0.40), 0 4px 16px rgba(0,0,0,0.15)',
        'glow-sky':     '0 0 20px rgba(59, 158, 248, 0.40), 0 4px 16px rgba(0,0,0,0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-danger':  '0 0 20px rgba(244, 63, 94, 0.35)',
        'card':         '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
