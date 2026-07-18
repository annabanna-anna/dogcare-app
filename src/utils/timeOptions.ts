const pad = (n: number) => String(n).padStart(2, '0')

/** All 96 quarter-hour times of a day: [{ value: "HH:mm", label: "h:mm AM" }] */
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4)
  const m = (i % 4) * 15
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return { value: `${pad(h)}:${pad(m)}`, label: `${h12}:${pad(m)} ${ampm}` }
})
