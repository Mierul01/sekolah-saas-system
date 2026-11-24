// Short navy "wipe" between the public pages (landing, login) and into the
// system: a panel with the logo covers the screen, the route changes under
// it, then it lifts away. Lives on <body> so it survives the route change.
// Skipped entirely under "reduce motion".

const COVER_MS = 420
const REVEAL_MS = 460
let running = false

// The app icon (same drawing as BrandMark), served from public/icons.
const LOGO_IMG = '<img src="/icons/icon.svg" width="72" height="72" alt="">'

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
  wipe.innerHTML = `<span class="page-wipe-mark">${LOGO_IMG}</span>`
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
