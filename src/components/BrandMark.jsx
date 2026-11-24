import { useId } from 'react'

// SchoolManage app icon: a school building (gold roof with clock, white
// columns, navy door, steps, shrubs, flag) on a glossy navy badge. Same
// drawing as public/icons/icon.svg and public/favicon.svg. Gradient ids are
// made unique per instance so several icons on one page never clash.
export default function BrandMark({ className = '', title }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (name) => `${name}-${uid}`
  const url = (name) => `url(#${id(name)})`

  return (
    <span className={`brand-mark ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <linearGradient id={id('bg')} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#2456a3" />
            <stop offset="0.55" stopColor="#123266" />
            <stop offset="1" stopColor="#0b1f3f" />
          </linearGradient>
          <linearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id('roof')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd98a" />
            <stop offset="1" stopColor="#eaa03a" />
          </linearGradient>
          <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9c9e4" />
            <stop offset="1" stopColor="#93a9cf" />
          </linearGradient>
          <linearGradient id={id('col')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#f1f5fb" />
            <stop offset="1" stopColor="#c9d5e8" />
          </linearGradient>
          <linearGradient id={id('door')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d4180" />
            <stop offset="1" stopColor="#0b1f3f" />
          </linearGradient>
        </defs>

        <rect width="64" height="64" rx="15" fill={url('bg')} />
        <path d="M0 15A15 15 0 0 1 15 0h34a15 15 0 0 1 15 15v9C44 18 20 18 0 26z" fill={url('gloss')} />
        <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1.5" />

        <ellipse cx="32" cy="52.2" rx="23" ry="2.6" fill="#000000" opacity="0.28" />

        <rect x="31.4" y="6.2" width="1.2" height="9.6" rx="0.5" fill="#e9eef7" />
        <path d="M32.6 6.8h7.2l-1.9 2.3 1.9 2.3h-7.2z" fill="#e5484d" />

        <path d="M9.5 25.2L32 14.2l22.5 11z" fill={url('roof')} />
        <path d="M9.5 25.2L32 14.2l22.5 11h-3.4L32 16.1 12.9 25.2z" fill="#ffffff" opacity="0.25" />
        <rect x="9.5" y="25.2" width="45" height="3" fill="#c47a18" />
        <circle cx="32" cy="21.3" r="3.1" fill="#ffffff" stroke="#0f2a56" strokeWidth="0.8" />
        <path d="M32 19.5v1.9l1.3.9" fill="none" stroke="#0f2a56" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="12" y="28.2" width="40" height="17.8" fill={url('wall')} />
        <g fill={url('col')}>
          <rect x="13.6" y="28.2" width="4.4" height="17.8" />
          <rect x="21.6" y="28.2" width="4.4" height="17.8" />
          <rect x="38" y="28.2" width="4.4" height="17.8" />
          <rect x="46" y="28.2" width="4.4" height="17.8" />
        </g>
        <g fill="#ffffff">
          <rect x="12.9" y="28.2" width="5.8" height="1.4" rx="0.3" />
          <rect x="20.9" y="28.2" width="5.8" height="1.4" rx="0.3" />
          <rect x="37.3" y="28.2" width="5.8" height="1.4" rx="0.3" />
          <rect x="45.3" y="28.2" width="5.8" height="1.4" rx="0.3" />
        </g>

        <path d="M28 46V36.6a4 4 0 0 1 8 0V46z" fill={url('door')} />
        <path d="M32 32.6V46" stroke="#f2a93b" strokeWidth="0.7" opacity="0.8" />

        <rect x="10.5" y="45.6" width="43" height="2.6" rx="0.6" fill="#eef2f9" />
        <rect x="8.5" y="48" width="47" height="2.8" rx="0.7" fill="#c3cfe3" />

        <circle cx="9" cy="47.4" r="3.6" fill="#1f8a5b" />
        <circle cx="11.8" cy="48.6" r="2.7" fill="#29a56d" />
        <circle cx="8" cy="46.4" r="1.6" fill="#4cc48b" opacity="0.7" />
        <circle cx="55" cy="47.4" r="3.6" fill="#1f8a5b" />
        <circle cx="52.2" cy="48.6" r="2.7" fill="#29a56d" />
        <circle cx="56" cy="46.4" r="1.6" fill="#4cc48b" opacity="0.7" />
      </svg>
    </span>
  )
}
