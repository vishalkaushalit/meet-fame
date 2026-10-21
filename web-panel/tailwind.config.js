/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../shared/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        meet: {
          navy: '#0F172A',
          dark: '#0A0F1D',
          slate: '#1E293B',
          card: '#111827',
          gray: '#64748B',
          light: '#F8FAFC',
        },
        brand: {
          blue: '#4F46E5',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          magenta: '#C026D3',
          pink: '#EC4899',
          coral: '#FF5E62',
          orange: '#FF7A59',
          amber: '#F59E0B',
          teal: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Poppins'],
        display: ['Poppins'],
        mono: ['Poppins'],
        serif: ['Poppins'],
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #FF5E62 100%)',
        'brand-warm':
          'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #FF7A59 100%)',
        'brand-glow':
          'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(255,94,98,0.05) 50%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
