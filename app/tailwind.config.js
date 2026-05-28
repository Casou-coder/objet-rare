/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette "luxe sobre" — à ajuster avec ta charte
        ink: {
          DEFAULT: '#0B0B0F',
          soft: '#1A1A22',
          mute: '#3A3A45',
        },
        bone: {
          DEFAULT: '#F6F2EA',
          soft: '#EAE3D6',
        },
        gold: {
          DEFAULT: '#B8975A',
          soft: '#D9B97A',
        },
        accent: {
          DEFAULT: '#7A5BFF',
        },
      },
      fontFamily: {
        sans: ['Inter'],
        serif: ['PlayfairDisplay'],
      },
    },
  },
  plugins: [],
};
