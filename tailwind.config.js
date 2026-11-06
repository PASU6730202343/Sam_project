/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pistachio: { DEFAULT: '#93C572', 600: '#6FA84C', 100: '#E6F2DB' },
        frost: { DEFAULT: '#EAF4F8', 200: '#D5E8F0' },
        denim: { DEFAULT: '#1F4E89', 700: '#173B68' },
        ink: '#0F2D52',
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: { pop: 'pop .2s ease-out', slideUp: 'slideUp .25s ease-out' },
    },
  },
  plugins: [],
};
