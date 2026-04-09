/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0c0c',
        surface: '#141414',
        border: '#1e1e1e',
        muted: '#7a7a7a',
        dim: '#4a4a4a',
        fox: '#e8702a',
        heading: '#e0e0e0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        bento: '10px',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
