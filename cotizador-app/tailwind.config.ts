import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08142b',
        steel: '#102750',
        ember: '#f97316',
        pearl: '#f6f8fc',
        slate: '#5f6b84'
      },
      boxShadow: {
        panel: '0 18px 34px rgba(8, 20, 43, 0.1)'
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Archivo', 'sans-serif']
      },
      keyframes: {
        liftIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        liftIn: 'liftIn 600ms ease-out both'
      }
    }
  },
  plugins: []
};

export default config;
