// Lightweight takes on React Bits components (reactbits.dev): SplitText,
// ShinyText, RollingNumber, SpotlightCard and Reveal, built on motion/react.
// Adapted from the wow-react-website reference build.
import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

export function SplitText({ text, className = '', delay = 0 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} className="split-word" aria-hidden>
          {[...word].map((ch, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block' }}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: delay + (w * 4 + i) * 0.035, type: 'spring', stiffness: 260, damping: 22 }}
            >
              {ch}
            </motion.span>
          ))}
          {' '}
        </span>
      ))}
    </span>
  )
}

export function ShinyText({ children, className = '' }) {
  return <span className={`shiny ${className}`}>{children}</span>
}

// Slot-machine counter: each digit spins through 0-9 and lands on its value.
// Replays every time it scrolls back into view.
export function RollingNumber({ value, suffix = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-30px' })
  const chars = [...String(value)]
  let digitIndex = 0
  return (
    <span ref={ref} className="roll" aria-label={`${value}${suffix}`}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} className="roll-sep" aria-hidden>{ch}</span>
        const d = Number(ch)
        const k = digitIndex++
        return (
          <span key={i} className="roll-col" aria-hidden>
            <motion.span
              className="roll-strip"
              initial={false}
              animate={{ y: inView ? `-${(10 + d) * 5}%` : '0%' }}
              transition={inView ? { delay: delay + k * 0.12, duration: 1.4 + k * 0.2, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
            >
              {Array.from({ length: 20 }, (_, n) => <span key={n}>{n % 10}</span>)}
            </motion.span>
          </span>
        )
      })}
      {suffix && <span className="roll-suffix" aria-hidden>{suffix}</span>}
    </span>
  )
}

export function SpotlightCard({ children, className = '', ...rest }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onMouseMove={onMove} className={`spotlight ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}
