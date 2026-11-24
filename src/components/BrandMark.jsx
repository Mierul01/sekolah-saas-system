// SchoolManage mark: a gold roof (the school) over an open white book
// (learning) on navy. Flat, two colours. Same drawing as
// public/icons/icon.svg and public/favicon.svg.
export default function BrandMark({ className = '', title }) {
  return (
    <span className={`brand-mark ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <rect width="64" height="64" rx="14" fill="#0f2a56" />
        <path d="M14 28.5L32 16.5l18 12" fill="none" stroke="#f2a93b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 34.5c6-2.6 11.3-2.1 15.6 1.4v14.4c-4.3-3.2-9.6-3.7-15.6-1.4z" fill="#ffffff" />
        <path d="M49 34.5c-6-2.6-11.3-2.1-15.6 1.4v14.4c4.3-3.2 9.6-3.7 15.6-1.4z" fill="#ffffff" />
      </svg>
    </span>
  )
}
