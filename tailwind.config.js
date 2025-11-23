/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: '#0066cc', // Shino Blue
          foreground: '#ffffff',
        },
        shino: {
          red: '#e63946', // Red from logo
          blue: '#0066cc', // Blue from logo
          yellow: '#ffcc00', // Yellow from palette
          dark: '#0f172a', // Dark background
        },
        secondary: {
          DEFAULT: '#e63946', // Shino Red
          foreground: '#ffffff',
        },
        background: '#f8fafc',
        surface: '#ffffff',
        petrol: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        }
      }
    }
  },
  plugins: [],
}
