import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#76C893',
          light: '#A8DDB5',
          dark: '#52B788',
        },
        accent: {
          DEFAULT: '#FF9E00',
          light: '#FFB74D',
          dark: '#E08900',
        },
        base: '#FFFAF0',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #76C893, #52B788)',
        'accent-gradient': 'linear-gradient(135deg, #FF9E00, #E08900)',
        'warm-gradient': 'linear-gradient(160deg, #FFFAF0 0%, #F0FFF4 50%, #FFF8E7 100%)',
      },
      boxShadow: {
        'soft': '0 4px 24px 0 rgba(118, 200, 147, 0.15)',
        'card': '0 2px 16px 0 rgba(255, 158, 0, 0.08)',
        'float': '0 8px 32px 0 rgba(118, 200, 147, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
