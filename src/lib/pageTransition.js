// Short navy "wipe" between the public pages (landing, login) and into the
// system: a panel with the logo covers the screen, the route changes under
// it, then it lifts away. Lives on <body> so it survives the route change.
// Skipped entirely under "reduce motion".

const COVER_MS = 420
const REVEAL_MS = 460
let running = false

const LOGO_SVG =
  '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">' +
  '<path d="M12 3L2 8l10 5 10-5-10-5z" fill="currentColor"/>' +
  '<path d="M6 12.6V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.4l-6 3-6-3z" fill="currentColor" opacity=".72"/></svg>'

export function playPageWipe(navigate, to, options) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Reduced motion, or a wipe already on screen: just change page.
  if (reduce || running) {
    navigate(to, options)
    return
  }
  running = true

  const wipe = document.createElement('div')
  wipe.className = 'page-wipe'
  wipe.setAttribute('aria-hidden', 'true')
  wipe.innerHTML = `<span class="page-wipe-mark">${LOGO_SVG}</span>`
  document.body.appendChild(wipe)

  // Next frame so the browser sees the start position before animating.
  requestAnimationFrame(() => {
    wipe.classList.add('is-covering')
    setTimeout(() => {
      navigate(to, options)
      window.scrollTo(0, 0)
      wipe.classList.add('is-leaving')
      setTimeout(() => {
        wipe.remove()
        running = false
      }, REVEAL_MS)
    }, COVER_MS)
  })
}
