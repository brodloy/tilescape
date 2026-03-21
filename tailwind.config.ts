import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"DM Sans"', 'sans-serif'],
        syne:  ['"Syne"', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        bg:        '#0c0a08',
        bg2:       '#110e0a',
        bg3:       '#181410',
        surface:   '#1c1812',
        surface2:  '#242018',
        gold:      '#e8b84b',
        'gold-dim':'#7a5c1e',
        green:     '#3ecf74',
        red:       '#e85555',
        purple:    '#a875f0',
        text: {
          DEFAULT: '#f0e8d8',
          2:       '#9a8f7a',
          3:       '#4a4438',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        lg:      '10px',
        xl:      '14px',
      },
    },
  },
  plugins: [],
}
export default config
