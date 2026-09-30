import { Link } from 'react-router-dom'
import { PRODUCT_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function PDPA() {
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
        <h1>{t('pdpa.title')}</h1>
        <p className="form-note" style={{ marginBottom: 24 }}>
          {t('pdpa.intro')}
        </p>

        <h3>{t('pdpa.s1Title')}</h3>
        <p>{t('pdpa.s1Body')}</p>

        <h3>{t('pdpa.s2Title')}</h3>
        <p>{t('pdpa.s2Body')}</p>

        <h3>{t('pdpa.s3Title')}</h3>
        <p>{t('pdpa.s3Body')}</p>

        <h3>{t('pdpa.s4Title')}</h3>
        <p>{t('pdpa.s4Body')}</p>

        <h3>{t('pdpa.s5Title')}</h3>
        <p style={{ marginBottom: 0 }}>{t('pdpa.s5Body')}</p>
      </div>
    </div>
  )
}
