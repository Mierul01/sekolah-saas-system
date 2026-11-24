import { useEffect, useRef, useState } from 'react'

// Fades/slides an element in whenever it scrolls into view, and resets it once
// it has left the screen, so the animation plays again every time the reader
// scrolls back to it (down or up). Under "reduce motion" it simply shows.
export default function Reveal({ children, className = '', delay = 0, ...rest }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      // The stagger delay only applies on the way in; leaving resets instantly.
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </div>
  )
}
