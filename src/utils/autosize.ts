/** Tallest a growing text area gets before it scrolls inside itself. */
export const TEXTAREA_MAX_HEIGHT = 240

/** Grows a textarea to fit its text, up to `max` px — past that it stops
 *  growing and shows its own scroll bar. */
export function autosize(el: HTMLTextAreaElement, max = TEXTAREA_MAX_HEIGHT) {
  el.style.height = 'auto'
  const full = el.scrollHeight
  el.style.height = `${Math.min(full, max)}px`
  el.style.overflowY = full > max ? 'auto' : 'hidden'
}
