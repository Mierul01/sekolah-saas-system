// Motion pieces for the landing page only: intro loader, smooth scroll,
// custom cursor, magnetic buttons, scroll-pinned hero, horizontal gallery and
// a tilted marquee. Adapted from the wow-react-website reference build.
// None of this is used inside /app (the system keeps normal scrolling).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform, animate } from 'motion/react'
import Lenis from 'lenis'

const INTRO_KEY = 'sm-intro-seen'

export function Loader({ word, mark }) {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem(INTRO_KEY) } catch { return true }
  })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!show) return
    document.documentElement.style.overflow = 'hidden'
    const c = animate(0, 100, { duration: 1.4, ease: [0.65, 0, 0.35, 1], onUpdate: (v) => setN(Math.round(v)) })
    const t = setTimeout(() => {
      setShow(false)
      try { sessionStorage.setItem(INTRO_KEY, '1') } catch { /* private mode */ }
    }, 1700)
    return () => { c.stop(); clearTimeout(t); document.documentElement.style.overflow = '' }
  }, [show])
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="loader"
          role="presentation"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }}>
            {mark}
          </motion.div>
          <div className="loader-word">{word}</div>
          <div className="loader-count">{String(n).padStart(3, '0')}</div>
          <div className="loader-bar"><i style={{ width: `${n}%` }} /></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Lenis smooth scroll while the landing page is mounted; destroyed on leave
// so the logged-in system keeps the browser's own scrolling.
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    let id
    const raf = (time) => { lenis.raf(time); id = requestAnimationFrame(raf) }
    id = requestAnimationFrame(raf)
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const target = a.getAttribute('href')
      if (target.length < 2 && target !== '#top') return
      e.preventDefault()
      lenis.scrollTo(target === '#top' ? 0 : target, { offset: -64, duration: 1.4 })
    }
    document.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(id); document.removeEventListener('click', onClick); lenis.destroy() }
  }, [])
}

export function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40 })
  const sy = useSpring(y, { stiffness: 500, damping: 40 })
  const [mode, setMode] = useState('')
  // Mouse users on a real desktop only; touch and phone-sized windows keep the normal cursor.
  const [enabled] = useState(() => window.matchMedia('(pointer: fine) and (min-width: 768px)').matches)
  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY)
      const el = e.target.closest?.('[data-cursor], a, button, input')
      setMode(el ? el.dataset.cursor || 'link' : '')
    }
    window.addEventListener('pointermove', move)
    return () => { window.removeEventListener('pointermove', move); document.documentElement.classList.remove('has-cursor') }
  }, [enabled, x, y])
  if (!enabled) return null
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} aria-hidden />
      <motion.div className={`cursor-ring ${mode ? `cursor-${mode === 'link' ? 'link' : 'label'}` : ''}`} style={{ x: sx, y: sy }} aria-hidden>
        {mode && mode !== 'link' && <span>{mode}</span>}
      </motion.div>
    </>
  )
}

export function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null)
  const x = useSpring(0, { stiffness: 250, damping: 15 })
  const y = useSpring(0, { stiffness: 250, damping: 15 })
  return (
    <motion.span
      ref={ref}
      className="magnetic"
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.span>
  )
}

// Hero that pins while the product screenshot grows from a card to full width.
// The opening block (lead and buttons) is fully gone before the closing block
// starts, so the two never sit on top of each other.
export function PinnedHero({ img, imgAlt, top, bottom, children }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  // Every value is worked out from the scroll position in JS (function form),
  // so they all move in step. Motion would otherwise hand some of them to the
  // browser's scroll timelines, which drifted out of sync with the others.
  const map = (a, b, from, to) => (p) => from + (to - from) * Math.min(1, Math.max(0, (p - a) / (b - a)))
  // Phones start the screenshot almost full width; it would be unreadably small at 46%.
  const [startScale] = useState(() => (window.matchMedia('(max-width: 600px)').matches ? 0.86 : 0.46))
  const scale = useTransform(scrollYProgress, map(0, 1, startScale, 1))
  const radius = useTransform(scrollYProgress, map(0, 1, 28, 10))
  const topX = useTransform(scrollYProgress, (p) => `${map(0, 1, 0, -30)(p)}%`)
  const botX = useTransform(scrollYProgress, (p) => `${map(0, 1, 0, 30)(p)}%`)
  // The big words leave before the closing text arrives, so they never collide.
  const wordFade = useTransform(scrollYProgress, map(0.4, 0.6, 1, 0))
  const fade = useTransform(scrollYProgress, map(0, 0.3, 1, 0))
  const fadeY = useTransform(scrollYProgress, map(0, 0.3, 0, 40))
  const metaVis = useTransform(scrollYProgress, (p) => (p < 0.3 ? 'visible' : 'hidden'))
  const shade = useTransform(scrollYProgress, map(0.45, 0.8, 0, 1))
  const overlay = useTransform(scrollYProgress, map(0.6, 0.9, 0, 1))
  const overlayY = useTransform(scrollYProgress, map(0.6, 0.9, 40, 0))
  const endVis = useTransform(scrollYProgress, (p) => (p > 0.6 ? 'visible' : 'hidden'))
  return (
    <section ref={ref} className="phero" id="top">
      <div className="phero-sticky">
        <motion.div className="phero-img" style={{ scale, borderRadius: radius }}>
          <img src={img} alt={imgAlt} width="1917" height="906" fetchpriority="high" />
        </motion.div>
        <motion.div className="phero-shade" style={{ opacity: shade }} />
        <motion.h1 className="phero-word phero-top" style={{ x: topX, opacity: wordFade }}>{top}</motion.h1>
        <motion.p className="phero-word phero-bot" style={{ x: botX, opacity: wordFade }} aria-hidden>{bottom}</motion.p>
        <motion.div className="phero-meta" style={{ opacity: fade, y: fadeY, visibility: metaVis }}>{children[0]}</motion.div>
        <motion.div className="phero-end" style={{ opacity: overlay, y: overlayY, visibility: endVis }}>{children[1]}</motion.div>
      </div>
    </section>
  )
}

// Vertical scroll drives the cards sideways while the section is pinned
// (desktop); on phones it becomes a plain swipe row.
export function HorizontalGallery({ children, head, swipeLabel, id }) {
  const ref = useRef(null)
  const track = useRef(null)
  const [dist, setDist] = useState(0)
  const [pin, setPin] = useState(true)
  useLayoutEffect(() => {
    const measure = () => {
      const wide = window.innerWidth > 760
      setPin(wide)
      setDist(wide ? Math.max(0, track.current.scrollWidth - window.innerWidth + 32) : 0)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  return (
    <section ref={ref} id={id} className="hgal" style={{ height: pin ? `calc(100vh + ${dist}px)` : 'auto' }}>
      <div className={pin ? 'hgal-sticky' : 'hgal-static'}>
        <div className="wrap hgal-head">{head}{!pin && <span className="swipe-hint">{swipeLabel} <i /></span>}</div>
        <motion.div ref={track} className="hgal-track" style={pin ? { x } : undefined}>
          {children}
        </motion.div>
        {pin && <div className="wrap hgal-progress"><motion.i style={{ width: bar }} /></div>}
      </div>
    </section>
  )
}

// Two tilted rows scrolling in opposite directions. Pauses on hover and with
// the pause button (motion longer than 5s needs a stop control).
export function TiltMarquee({ rows, pauseLabel, playLabel }) {
  const [paused, setPaused] = useState(false)
  return (
    <div className={`tilt ${paused ? 'is-paused' : ''}`}>
      {rows.map((items, r) => (
        <div key={r} className={`tilt-row ${r % 2 ? 'tilt-rev' : ''}`} aria-hidden={r > 0}>
          <div className="tilt-track">
            {[...items, ...items, ...items].map((t, i) => <span key={i}>{t}<b aria-hidden>●</b></span>)}
          </div>
        </div>
      ))}
      <button type="button" className="tilt-pause" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? playLabel : pauseLabel}
      </button>
    </div>
  )
}
