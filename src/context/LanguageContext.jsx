import { createContext, useContext, useEffect, useState } from 'react'
import { getTranslator } from '../lib/translations'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'app_language'

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ms' || stored === 'en') return stored
  } catch {
    /* localStorage unavailable */
  }
  return 'ms'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      /* ignore */
    }
  }, [language])

  function setLanguage(lang) {
    if (lang === 'ms' || lang === 'en') setLanguageState(lang)
  }

  const t = getTranslator(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
