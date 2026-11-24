import { useNavigate } from 'react-router-dom'
import { playPageWipe } from '../lib/pageTransition'

// A normal link (real href, so new-tab and middle-click still work) that
// plays the page wipe before changing page on a plain click.
export default function TransitionLink({ to, onClick, children, ...rest }) {
  const navigate = useNavigate()
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        playPageWipe(navigate, to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
