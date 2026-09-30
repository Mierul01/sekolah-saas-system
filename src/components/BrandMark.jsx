export default function BrandMark({ className = '' }) {
  return (
    <div className={`brand-mark ${className}`}>
      <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none">
        <path d="M12 3L2 8l10 5 10-5-10-5z" fill="currentColor" />
        <path d="M6 12.6V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.4l-6 3-6-3z" fill="currentColor" opacity=".72" />
      </svg>
    </div>
  )
}
