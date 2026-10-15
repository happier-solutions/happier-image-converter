import React, { useRef, useState } from 'react'
import {
  ClipboardPaste,
  Code2,
  FileCode,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { AppLogoIcon } from './AppLogoIcon'

interface DropPasteZoneProps {
  onSelectFile: (file: File) => void
  onPasteClipboardButton: () => void
  onPasteRawSvgText: (svgCode: string) => void
  onSelectSample: (kind: 'svg' | 'png' | 'jpeg') => void
  isLoading: boolean
  errorMessage: string | null
}

export function DropPasteZone({
  onSelectFile,
  onPasteClipboardButton,
  onPasteRawSvgText,
  onSelectSample,
  isLoading,
  errorMessage,
}: DropPasteZoneProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showSvgInput, setShowSvgInput] = useState(false)
  const [svgDraft, setSvgDraft] = useState('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      onSelectFile(droppedFile)
      return
    }

    const textData = e.dataTransfer.getData('text/plain')
    if (textData && textData.includes('<svg')) {
      onPasteRawSvgText(textData)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Craft.do Document Sheet Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`craft-panel rounded-[32px] p-6 sm:p-10 md:p-12 transition-all duration-300 relative overflow-hidden ${
          isDragging
            ? 'ring-2 ring-stone-900 bg-white/95 scale-[1.005]'
            : 'hover:shadow-[0_20px_50px_-12px_rgba(28,25,23,0.08)]'
        }`}
      >
        {/* Subtle decorative warm glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-100/40 blur-3xl" />

        {/* Editorial Header */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-8">
          <div className="flex justify-center mb-4">
            <AppLogoIcon className="w-14 h-14 drop-shadow-sm" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 text-xs font-medium text-stone-600 mb-5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.hero.offlineBadge}</span>
          </div>

          <h1 className="font-serif-editorial text-4xl sm:text-5xl md:text-[54px] leading-[1.08] tracking-tight text-stone-900 mb-4">
            {t.hero.title}
          </h1>
          <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
            {t.hero.subtitlePrefix}{' '}
            <strong className="text-stone-800 font-medium">
              {t.hero.subtitleFormats}
            </strong>{' '}
            {t.hero.subtitleMid}{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-800 font-mono-tabular text-xs">
              {t.hero.subtitleClipboard}
            </span>{' '}
            {t.hero.subtitleSuffix}
          </p>
        </div>

        {/* Dropzone Interactive Surface */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative z-10 cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-200 p-8 sm:p-10 text-center ${
            isDragging
              ? 'border-stone-900 bg-stone-50/90'
              : 'border-stone-300/80 bg-[#FAF9F5]/80 hover:bg-white hover:border-stone-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onSelectFile(file)
              e.target.value = ''
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-center justify-center mx-auto mb-4 text-stone-800">
            <Upload className="w-6 h-6 stroke-[1.75]" />
          </div>

          <p className="text-base sm:text-lg font-medium text-stone-900 mb-1">
            {t.hero.dropTitle}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 mb-6">
            {t.hero.dropSupportPrefix}{' '}
            <span className="font-mono-tabular text-stone-700">
              .svg, .png, .jpg, .webp
            </span>{' '}
            · {t.hero.dropSupportOrPress}{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono-tabular bg-white border border-stone-300 rounded-md shadow-2xs text-stone-800">
              ⌘V
            </kbd>{' '}
            /{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono-tabular bg-white border border-stone-300 rounded-md shadow-2xs text-stone-800">
              Ctrl+V
            </kbd>{' '}
            {t.hero.dropSupportAnytime}
          </p>

          {/* Action Buttons Row */}
          <div
            className="flex flex-wrap items-center justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white text-sm font-medium shadow-sm transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{t.hero.chooseFileBtn}</span>
            </button>

            <button
              type="button"
              onClick={onPasteClipboardButton}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-800 border border-stone-200/90 text-sm font-medium shadow-2xs transition cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4 text-emerald-600" />
              <span>{t.hero.pasteClipboardBtn}</span>
              <kbd className="ml-1 px-1.5 py-0.5 text-[11px] font-mono-tabular bg-stone-100 text-stone-600 rounded">
                ⌘V
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setShowSvgInput((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 text-sm font-medium shadow-2xs transition cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-amber-600" />
              <span>{t.hero.pasteSvgCodeBtn}</span>
            </button>
          </div>
        </div>

        {/* Optional Raw SVG Code Drawer */}
        {showSvgInput && (
          <div className="relative z-10 mt-4 p-4 rounded-2xl bg-stone-100/80 border border-stone-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                {t.hero.svgDrawerTitle}
              </span>
              <button
                type="button"
                onClick={() => setShowSvgInput(false)}
                className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                {t.hero.closeBtn}
              </button>
            </div>
            <textarea
              value={svgDraft}
              onChange={(e) => setSvgDraft(e.target.value)}
              placeholder='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">...</svg>'
              rows={4}
              className="w-full rounded-xl bg-white border border-stone-200/90 p-3 font-mono-tabular text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900/20"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                disabled={!svgDraft.trim().includes('<svg')}
                onClick={() => {
                  onPasteRawSvgText(svgDraft)
                  setShowSvgInput(false)
                }}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium disabled:opacity-40 hover:bg-stone-800 transition cursor-pointer"
              >
                {t.hero.optimizeSvgBtn}
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="relative z-10 mt-4 px-4 py-3 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Craft Bento Sample Cards */}
        <div className="relative z-10 mt-8 pt-7 border-t border-stone-200/70">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {t.hero.sampleSectionTitle}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              type="button"
              onClick={() => onSelectSample('svg')}
              disabled={isLoading}
              className="group text-left p-4 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/80 hover:border-stone-300 shadow-2xs hover:shadow-md transition-all flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-stone-900">
                    {t.hero.sampleSvgTitle}
                  </span>
                  <span className="text-[10px] font-mono-tabular uppercase px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 font-semibold">
                    SVG
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t.hero.sampleSvgDesc}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSample('png')}
              disabled={isLoading}
              className="group text-left p-4 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/80 hover:border-stone-300 shadow-2xs hover:shadow-md transition-all flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-stone-900">
                    {t.hero.samplePngTitle}
                  </span>
                  <span className="text-[10px] font-mono-tabular uppercase px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 font-semibold">
                    PNG
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t.hero.samplePngDesc}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSample('jpeg')}
              disabled={isLoading}
              className="group text-left p-4 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/80 hover:border-stone-300 shadow-2xs hover:shadow-md transition-all flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-700 shrink-0 group-hover:scale-105 transition">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-stone-900">
                    {t.hero.sampleJpgTitle}
                  </span>
                  <span className="text-[10px] font-mono-tabular uppercase px-1.5 py-0.5 rounded bg-sky-100/80 text-sky-800 font-semibold">
                    JPG
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t.hero.sampleJpgDesc}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
