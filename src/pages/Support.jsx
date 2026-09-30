import { Link } from 'react-router-dom'
import { PRODUCT_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Support() {
  const { t } = useLanguage()

  return (
    <div className="pdpa-screen">
      <div className="pdpa-card">
        <div className="login-top-row">
          <Link to="/" className="login-back-link">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('login.backToHome')}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="landing-brand" style={{ marginBottom: 20 }}>
          <BrandMark />
          <strong>{PRODUCT_NAME}</strong>
        </div>
        <h1>{t('support.title')}</h1>
        <p className="form-note" style={{ marginBottom: 24 }}>
          {t('support.intro')}
        </p>

        <h3>{t('support.s1Title')}</h3>
        <p>{t('support.s1Body')}</p>

        <h3>{t('support.s2Title')}</h3>
        <p>{t('support.s2Body')}</p>

        <h3>{t('support.s3Title')}</h3>
        <p style={{ marginBottom: 0 }}>{t('support.s3Body')}</p>
      </div>
    </div>
  )
}
