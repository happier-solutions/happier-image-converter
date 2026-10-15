import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe, X } from 'lucide-react'
import { useI18n } from '../i18n'

export function LanguageSuggestionBanner() {
  const {
    showEnglishPrompt,
    acceptEnglishPrompt,
    dismissEnglishPrompt,
  } = useI18n()

  if (!showEnglishPrompt) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl pointer-events-none">
      <div className="pointer-events-auto craft-panel craft-dropdown-pop rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border border-stone-200/90 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs text-stone-700">
          <span className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200/80 flex items-center justify-center text-sm shrink-0">
            🇺🇸
          </span>
          <span>
            We noticed your browser language is <strong>English</strong>. Would
            you like to switch the interface to English?
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={acceptEnglishPrompt}
            className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition cursor-pointer"
          >
            Switch to English
          </button>
          <button
            type="button"
            onClick={dismissEnglishPrompt}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-600 text-xs font-medium transition cursor-pointer"
          >
            Giữ Tiếng Việt
          </button>
          <button
            type="button"
            onClick={dismissEnglishPrompt}
            aria-label="Dismiss language suggestion"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function LanguageSwitcher() {
  const { locale, setLocale, locales } = useI18n()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentInfo = locales.find((l) => l.code === locale) || locales[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-stone-700 hover:bg-stone-100/90 transition cursor-pointer"
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 text-stone-500" />
        <span className="font-mono-tabular font-semibold text-stone-800">
          {currentInfo.shortLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="craft-panel craft-dropdown-pop absolute right-0 mt-2 w-40 rounded-2xl p-1.5 z-50 shadow-lg border border-stone-200/90">
          {locales.map((item) => {
            const active = item.code === locale
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLocale(item.code)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-700 hover:bg-stone-100/90'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>{item.nativeName}</span>
                </span>
                {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
