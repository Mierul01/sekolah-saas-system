import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

function Icon({ path, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={path} />
    </svg>
  )
}

const MAIL_ICON = 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z M22 6l-10 7L2 6'
const CLOCK_ICON = 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2'
const CHEVRON_ICON = 'M6 9l6 6 6-6'

function getFaqs(t) {
  return [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
  ]
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button type="button" className="faq-question" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{q}</span>
        <Icon path={CHEVRON_ICON} width="16" height="16" className={`faq-chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  )
}

export default function Help() {
  const { t } = useLanguage()
  const faqs = getFaqs(t)

  return (
    <div>
      <div className="page-head">
        <h1>{t('help.title')}</h1>
        <p>{t('help.desc')}</p>
      </div>

      <div className="help-layout">
        <div className="content-card help-contact-card">
          <div className="module-icon bg-blue help-contact-icon"><Icon path={MAIL_ICON} width="22" height="22" /></div>
          <h3 className="card-heading">{t('help.contactIct')}</h3>
          <div className="help-contact-row">
            <Icon path={MAIL_ICON} width="15" height="15" />
            <a href="mailto:ict@sekolah.edu.my">ict@sekolah.edu.my</a>
          </div>
          <div className="help-contact-row">
            <Icon path={CLOCK_ICON} width="15" height="15" />
            <span>{t('help.supportHours')}</span>
          </div>
        </div>

        <div className="content-card">
          <h3 className="card-heading">{t('help.faq')}</h3>
          <div className="faq-list">
            {faqs.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
