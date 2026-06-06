/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0b0b',
        surface: '#151515',
        border: '#252525',
        muted: '#949494',
        dim: '#6a6a6a',
        fox: '#e8702a',
        heading: '#f0f0f0',
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
