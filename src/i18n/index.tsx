import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { vi, type Dictionary } from './locales/vi'
import { en } from './locales/en'

export type Locale = 'vi' | 'en'

export interface LocaleInfo {
  code: Locale
  shortLabel: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  {
    code: 'vi',
    shortLabel: 'VI',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    code: 'en',
    shortLabel: 'EN',
    nativeName: 'English',
    flag: '🇺🇸',
  },
]

const DICTIONARIES: Record<Locale, Dictionary> = {
  vi,
  en,
}

const STORAGE_KEY = 'happier-image-lang-pref'
const BANNER_DISMISSED_KEY = 'happier-image-en-banner-dismissed'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'vi'

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'vi' || saved === 'en') {
      return saved
    }
  } catch {
    // Ignore storage errors
  }

  // Always default to Vietnamese when no explicit choice is saved
  return 'vi'
}

function isBrowserEnglish(): boolean {
  if (typeof window === 'undefined') return false
  const primary = window.navigator.language?.toLowerCase() || ''
  if (primary.startsWith('en')) return true
  const list = window.navigator.languages || []
  return list.length > 0 && list[0]?.toLowerCase().startsWith('en')
}

interface I18nContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
  t: Dictionary
  locales: LocaleInfo[]
  showEnglishPrompt: boolean
  acceptEnglishPrompt: () => void
  dismissEnglishPrompt: () => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'vi',
  setLocale: () => {},
  t: vi,
  locales: SUPPORTED_LOCALES,
  showEnglishPrompt: false,
  acceptEnglishPrompt: () => {},
  dismissEnglishPrompt: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())
  const [showEnglishPrompt, setShowEnglishPrompt] = useState(false)

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(STORAGE_KEY)
      const dismissed = window.localStorage.getItem(BANNER_DISMISSED_KEY)
      if (!savedLocale && !dismissed && isBrowserEnglish()) {
        setShowEnglishPrompt(true)
      }
    } catch {
      // Ignore
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    setShowEnglishPrompt(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    } catch {
      // Ignore
    }
  }, [])

  const acceptEnglishPrompt = useCallback(() => {
    setLocale('en')
  }, [setLocale])

  const dismissEnglishPrompt = useCallback(() => {
    setShowEnglishPrompt(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, 'vi')
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    } catch {
      // Ignore
    }
  }, [])

  const t = DICTIONARIES[locale] || vi

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.meta.title
  }, [locale, t.meta.title])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      locales: SUPPORTED_LOCALES,
      showEnglishPrompt,
      acceptEnglishPrompt,
      dismissEnglishPrompt,
    }),
    [
      locale,
      setLocale,
      t,
      showEnglishPrompt,
      acceptEnglishPrompt,
      dismissEnglishPrompt,
    ],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
