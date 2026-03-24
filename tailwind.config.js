/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:  '#0A0A0A',
        accent:   '#6366F1',
        success:  '#22C55E',
        warning:  '#F59E0B',
        danger:   '#EF4444',
        surface:  '#FFFFFF',
        muted:    '#6B7280',
      },
    },
  },
  plugins: [],
};