/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Vanessa Nails Brand Palette (from @nailsvanessa.cl) ──────────────
        // Inspired by Apple's single-accent philosophy applied to the brand's
        // real Instagram aesthetic: vibrant fuchsia + metallic gold + marble white

        brand: {
          // Primary: Vibrant Magenta / Fuchsia — the dominant brand identity color
          DEFAULT:   '#E11B74',
          light:     '#F04A94',
          lighter:   '#F87CB3',
          lightest:  '#FDE8F2',
          dark:      '#B8105D',
          darker:    '#8C0A47',
        },
        gold: {
          // Accent: Metallic Gold — premium markers, borders, highlights
          DEFAULT:   '#C5A059',
          light:     '#D4B878',
          lighter:   '#EDD9A3',
          lightest:  '#FBF4E3',
          dark:      '#A07D3A',
          darker:    '#7A5E25',
        },
        marble: {
          // Background: Marble White — the primary photography bg
          DEFAULT:   '#F9F9F9',
          warm:      '#FDF6F0',
          blush:     '#FEF0F4',
          tint:      '#FBF4FB',
        },
        rose: {
          // Secondary: Soft Pale Pink — backgrounds and soft fills
          pale:      '#F8E1E7',
          soft:      '#F2C8D4',
          mid:       '#E8A0B8',
          deep:      '#CC5580',
        },
        ink: {
          // Typography: Deep Charcoal — Apple-style near-black hierarchy
          DEFAULT:   '#1A1A1A',
          medium:    '#3D1929',
          muted:     '#7A3A55',
          faint:     '#B0708A',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        'pill': '9999px',
      },
      boxShadow: {
        // Apple-style soft diffused shadows — never heavy
        'brand-sm':  '0 8px 24px rgba(225, 27, 116, 0.14)',
        'brand-md':  '0 20px 48px rgba(225, 27, 116, 0.18)',
        'brand-lg':  '0 32px 80px rgba(225, 27, 116, 0.22)',
        'gold-sm':   '0 6px 18px rgba(197, 160, 89, 0.20)',
        'glass':     '0 8px 32px rgba(225, 27, 116, 0.10)',
      },
      backgroundImage: {
        // Core page gradient — marble/blush cinematic backdrop
        'page-light': `
          radial-gradient(circle at top,    rgba(225, 27, 116, 0.12), transparent 30%),
          radial-gradient(circle at 82% 12%, rgba(197, 160, 89, 0.18), transparent 24%),
          radial-gradient(circle at 18% 78%, rgba(248, 161, 195, 0.16), transparent 26%),
          linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 40%, #FDF6EF 100%)
        `,
        // Dark cinematic glass — for immersive sections (Apple-style)
        'dark-glass': `linear-gradient(135deg, rgba(28,10,20,0.94), rgba(18,6,14,0.98))`,
        // Brand gradient — primary button / chip fill
        'brand-gradient': `linear-gradient(160deg, #F04A94 0%, #E11B74 50%, #B8105D 100%)`,
        // Gold gradient — accent elements
        'gold-gradient':  `linear-gradient(135deg, #D4B878 0%, #C5A059 60%, #A07D3A 100%)`,
      },
    },
  },
  plugins: [],
}