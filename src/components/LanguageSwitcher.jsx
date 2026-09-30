import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={`lang-switch ${className}`}>
      <button
        type="button"
        className={language === 'ms' ? 'active' : ''}
        onClick={() => setLanguage('ms')}
      >
        BM
      </button>
      <button
        type="button"
        className={language === 'en' ? 'active' : ''}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  )
}
