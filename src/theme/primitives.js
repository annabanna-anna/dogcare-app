/**
 * Primitive colors — the raw ingredients of the palette, 50 (lightest) to
 * 950 (darkest). Don't use these directly in components: tailwind.config.js
 * maps them to semantic tokens (coral, text-primary, …) and those are what
 * the UI uses. The design system's Color page renders this file as-is.
 *
 * Ember, Cobalt, Green and Ink are HeyPup's own ramps. Their anchor steps are
 * the exact values the app was built with (Ember 500 = #ff4514, Ember 600 =
 * #d93a10, Cobalt 600 = #2344dd, Ink 950 = #141414 …); the steps between were
 * interpolated in OKLab. Red, Gray and Purple are Tailwind's default ramps,
 * which the app's fixed status and task colors already come from.
 */

export const white = '#ffffff'
export const black = '#000000'

export const primitives = {
  ember: {
    50: '#fff5f3', 100: '#ffe4da', 200: '#ffc2af', 300: '#ff9e83', 400: '#ff7655', 500: '#ff4514',
    600: '#d93a10', 700: '#b42b04', 800: '#911d00', 900: '#6f0e00', 950: '#4f0200',
  },
  cobalt: {
    50: '#eef1fd', 100: '#dee3fa', 200: '#d3daf8', 300: '#a3b8f4', 400: '#7595ef', 500: '#4a70e7',
    600: '#2344dd', 700: '#1c37b8', 800: '#172f98', 900: '#122779', 950: '#0e1e5c',
  },
  green: {
    50: '#f3f8f5', 100: '#dcfce7', 200: '#b5ecbb', 300: '#8cdc8f', 400: '#5fcb5f', 500: '#18ba1d',
    600: '#179d34', 700: '#15803d', 800: '#166534', 900: '#114925', 950: '#0b2e17',
  },
  ink: {
    50: '#fcfcfc', 100: '#f4f4ef', 200: '#e2e2e0', 300: '#d1d1d1', 400: '#a1a1a1', 500: '#78766e',
    600: '#5c5c5c', 700: '#494949', 800: '#363636', 900: '#242424', 950: '#141414',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444',
    600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280',
    600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7',
    600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
  },
}

/** What each ramp is for — shown next to it on the Color page. */
export const rampRoles = {
  ember: 'Brand. Action, status and emphasis.',
  cobalt: 'Accent. Headings, wayfinding, walks.',
  green: 'Potty breaks and done states.',
  ink: 'Warm neutrals: surfaces, text, hairlines.',
  red: 'Danger and overdue.',
  gray: 'Cool neutrals: muted text, avatar blocks.',
  purple: 'Medication.',
}
