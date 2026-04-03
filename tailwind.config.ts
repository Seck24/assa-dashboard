import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00c853',
          dark:    '#00a650',
          glow:    'rgba(0,200,83,0.25)',
        },
        obs: {
          bg:      '#0e0e0e',
          s1:      '#131313',
          s2:      '#1a1919',
          s3:      '#201f1f',
          s4:      '#262626',
          cyan:    '#00e3fd',
          amber:   '#ffbd5c',
        },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      keyframes: {
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-40px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-left':  'slide-left 0.2s ease-out',
        'slide-right': 'slide-right 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
