import React, { useState } from 'react'
import {
  Check,
  Copy,
  Download,
  Lock,
  Maximize2,
  Sliders,
  Sparkles,
  Unlock,
} from 'lucide-react'
import { formatBytes, getExtensionForFormat } from '../lib/image-decoder'
import { useI18n } from '../i18n'
import type {
  OptimizationOptions,
  OptimizedResult,
  OutputFormat,
  SourceImageItem,
} from '../types/image'

interface OptimizationPanelProps {
  source: SourceImageItem
  options: OptimizationOptions
  onChangeOptions: (updater: (prev: OptimizationOptions) => OptimizationOptions) => void
  result: OptimizedResult | null
  isProcessing: boolean
}

const ALL_FORMATS: { id: OutputFormat; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPG' },
  { id: 'webp', label: 'WebP' },
  { id: 'avif', label: 'AVIF' },
]

export function OptimizationPanel({
  source,
  options,
  onChangeOptions,
  result,
  isProcessing,
}: OptimizationPanelProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const aspectRatio = source.width / Math.max(1, source.height)

  const handleWidthChange = (newWidth: number) => {
    const clampedWidth = Math.max(1, Math.min(8192, newWidth || 1))
    onChangeOptions((prev) => ({
      ...prev,
      targetWidth: clampedWidth,
      targetHeight: prev.maintainAspectRatio
        ? Math.max(1, Math.round(clampedWidth / aspectRatio))
        : prev.targetHeight,
    }))
  }

  const handleHeightChange = (newHeight: number) => {
    const clampedHeight = Math.max(1, Math.min(8192, newHeight || 1))
    onChangeOptions((prev) => ({
      ...prev,
      targetHeight: clampedHeight,
      targetWidth: prev.maintainAspectRatio
        ? Math.max(1, Math.round(clampedHeight * aspectRatio))
        : prev.targetWidth,
    }))
  }

  const handleDownload = () => {
    if (!result) return
    const ext = getExtensionForFormat(result.format)
    const baseName = source.name.replace(/\.[^/.]+$/, '') || 'happier-image'
    const a = document.createElement('a')
    a.href = result.url
    a.download = `${baseName}-optimized.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyResult = async () => {
    if (!result) return
    try {
      if (result.format === 'svg' && result.svgText) {
        await navigator.clipboard.writeText(result.svgText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }

      if (navigator.clipboard && 'write' in navigator.clipboard) {
        let pngBlob = result.blob
        if (result.mimeType !== 'image/png') {
          const img = new Image()
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject()
            img.src = result.url
          })
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || result.width
          canvas.height = img.naturalHeight || result.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          pngBlob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), 'image/png'),
          )
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob }),
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // Fallback
    }
  }

  const savedBytes = result ? source.size - result.size : 0
  const savedPct =
    result && source.size > 0
      ? ((source.size - result.size) / source.size) * 100
      : 0

  return (
    <div className="flex flex-col gap-3.5">
      {/* Bento Card 1: Output Format Segmented Selector */}
      <div className="craft-panel rounded-[26px] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-stone-700" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t.panel.outputFormatTitle}
            </h2>
          </div>
          {source.format === 'svg' && options.outputFormat !== 'svg' && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800">
              {t.panel.svgToRasterBadge}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-stone-200/75 border border-stone-200/90">
          {ALL_FORMATS.map((fmt) => {
            const disabled = fmt.id === 'svg' && source.format !== 'svg'
            const active = options.outputFormat === fmt.id
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    outputFormat: fmt.id,
                  }))
                }
                title={
                  disabled
                    ? t.panel.svgOnlyTooltip
                    : `${t.panel.exportFormatTooltipPrefix} ${fmt.label}`
                }
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed text-stone-400'
                    : active
                      ? 'bg-white text-stone-900 shadow-xs cursor-pointer'
                      : 'text-stone-600 hover:text-stone-900 cursor-pointer'
                }`}
              >
                {fmt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bento Card 2: Codec-Specific Parameters */}
      <div className="craft-panel rounded-[26px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {t.panel.compressionParamsTitle} ({options.outputFormat.toUpperCase()})
          </span>
          {result?.engineLabel && (
            <span className="text-[11px] font-mono-tabular text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              {result.engineLabel}
            </span>
          )}
        </div>

        {/* SVG -> SVGO Controls */}
        {options.outputFormat === 'svg' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-stone-700">
                  {t.panel.svgFloatPrecision}
                </span>
                <span className="font-mono-tabular font-semibold text-stone-900">
                  {options.svgFloatPrecision} {t.panel.digitsUnit}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={options.svgFloatPrecision}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    svgFloatPrecision: Number(e.target.value),
                  }))
                }
                className="craft-slider"
              />
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>{t.panel.precisionMin}</span>
                <span>{t.panel.precisionMax}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-xl craft-card-inset cursor-pointer">
                <span className="text-xs font-medium text-stone-700">
                  {t.panel.svgMultipass}
                </span>
                <input
                  type="checkbox"
                  checked={options.svgMultipass}
                  onChange={(e) =>
                    onChangeOptions((prev) => ({
                      ...prev,
                      svgMultipass: e.target.checked,
                    }))
                  }
                  className="accent-stone-900 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl craft-card-inset cursor-pointer">
                <span className="text-xs font-medium text-stone-700">
                  {t.panel.svgCleanupIds}
                </span>
                <input
                  type="checkbox"
                  checked={options.svgCleanupIds}
                  onChange={(e) =>
                    onChangeOptions((prev) => ({
                      ...prev,
                      svgCleanupIds: e.target.checked,
                    }))
                  }
                  className="accent-stone-900 w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* JPEG -> MozJPEG Controls */}
        {options.outputFormat === 'jpeg' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-stone-700">
                  {t.panel.jpegQuality}
                </span>
                <span className="font-mono-tabular font-semibold text-stone-900">
                  {options.jpegQuality}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={options.jpegQuality}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    jpegQuality: Number(e.target.value),
                  }))
                }
                className="craft-slider"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl craft-card-inset">
              <span className="text-xs font-medium text-stone-700">
                {t.panel.backgroundFill}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={options.backgroundFill}
                  onChange={(e) =>
                    onChangeOptions((prev) => ({
                      ...prev,
                      backgroundFill: e.target.value,
                    }))
                  }
                  className="w-6 h-6 rounded border border-stone-300 cursor-pointer"
                />
                <span className="text-xs font-mono-tabular text-stone-600 uppercase">
                  {options.backgroundFill}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PNG -> OxiPNG Controls */}
        {options.outputFormat === 'png' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-stone-700">
                  {t.panel.pngEffort}
                </span>
                <span className="font-mono-tabular font-semibold text-stone-900">
                  Level {options.pngLevel} / 6
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={options.pngLevel}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    pngLevel: Number(e.target.value),
                  }))
                }
                className="craft-slider"
              />
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>{t.panel.pngFastest}</span>
                <span>{t.panel.pngDeepest}</span>
              </div>
            </div>
          </div>
        )}

        {/* WebP Controls */}
        {options.outputFormat === 'webp' && (
          <div className="space-y-3.5">
            <label className="flex items-center justify-between p-2.5 rounded-xl craft-card-inset cursor-pointer">
              <span className="text-xs font-medium text-stone-700">
                {t.panel.webpLossless}
              </span>
              <input
                type="checkbox"
                checked={options.webpLossless}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    webpLossless: e.target.checked,
                  }))
                }
                className="accent-stone-900 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            {!options.webpLossless && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-stone-700">
                    {t.panel.webpQuality}
                  </span>
                  <span className="font-mono-tabular font-semibold text-stone-900">
                    {options.webpQuality}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={options.webpQuality}
                  onChange={(e) =>
                    onChangeOptions((prev) => ({
                      ...prev,
                      webpQuality: Number(e.target.value),
                    }))
                  }
                  className="craft-slider"
                />
              </div>
            )}
          </div>
        )}

        {/* AVIF Controls */}
        {options.outputFormat === 'avif' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-stone-700">
                  {t.panel.avifQuality}
                </span>
                <span className="font-mono-tabular font-semibold text-stone-900">
                  {options.avifQuality}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={options.avifQuality}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    avifQuality: Number(e.target.value),
                  }))
                }
                className="craft-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-stone-700">
                  {t.panel.avifSpeed}
                </span>
                <span className="font-mono-tabular font-semibold text-stone-900">
                  {options.avifSpeed} / 10
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={options.avifSpeed}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    avifSpeed: Number(e.target.value),
                  }))
                }
                className="craft-slider"
              />
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>{t.panel.avifThorough}</span>
                <span>{t.panel.avifInstant}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bento Card 3: Dimensions / SVG Scale & Resize (when outputting Raster) */}
      {options.outputFormat !== 'svg' && (
        <div className="craft-panel rounded-[26px] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-stone-700" />
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {t.panel.dimensionsTitle}
              </span>
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.resizeEnabled}
                onChange={(e) =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    resizeEnabled: e.target.checked,
                    targetWidth: source.width * prev.svgScale,
                    targetHeight: source.height * prev.svgScale,
                  }))
                }
                className="accent-stone-900 w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>{t.panel.customPxToggle}</span>
            </label>
          </div>

          {/* SVG Raster Scale Selector */}
          {source.format === 'svg' && !options.resizeEnabled && (
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-stone-600">{t.panel.svgScaleLabel}</span>
                <span className="font-mono-tabular font-medium text-stone-800">
                  {Math.round(source.width * options.svgScale)}×
                  {Math.round(source.height * options.svgScale)} px
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-stone-200/70">
                {[1, 2, 3, 4].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() =>
                      onChangeOptions((prev) => ({
                        ...prev,
                        svgScale: scale,
                      }))
                    }
                    className={`py-1.5 rounded-lg text-xs font-mono-tabular font-semibold transition cursor-pointer ${
                      options.svgScale === scale
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {options.resizeEnabled && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">
                  {t.panel.widthLabel}
                </label>
                <input
                  type="number"
                  min={1}
                  max={8192}
                  value={options.targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 font-mono-tabular text-xs text-stone-900"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  onChangeOptions((prev) => ({
                    ...prev,
                    maintainAspectRatio: !prev.maintainAspectRatio,
                  }))
                }
                title={t.panel.lockAspectRatioTitle}
                className={`mt-4 p-2 rounded-xl border transition cursor-pointer ${
                  options.maintainAspectRatio
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-500 border-stone-200'
                }`}
              >
                {options.maintainAspectRatio ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="flex-1">
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">
                  {t.panel.heightLabel}
                </label>
                <input
                  type="number"
                  min={1}
                  max={8192}
                  value={options.targetHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 font-mono-tabular text-xs text-stone-900"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bento Card 4: Export Summary & Download Actions */}
      <div className="craft-panel rounded-[26px] p-5 bg-white/95">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            {t.panel.resultTitle}
          </span>
          {result && (
            <span className="text-[11px] font-mono-tabular text-stone-400">
              {result.durationMs} ms
            </span>
          )}
        </div>

        {/* Size Comparison Row */}
        <div className="p-3.5 rounded-2xl craft-card-inset flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-stone-500 mb-0.5">
              {t.panel.sizeAfterLabel}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono-tabular text-stone-900">
                {result ? formatBytes(result.size) : '...'}
              </span>
              <span className="text-xs font-mono-tabular text-stone-400 line-through">
                {formatBytes(source.size)}
              </span>
            </div>
          </div>

          {result && (
            <div
              className={`px-3 py-1.5 rounded-xl font-mono-tabular text-xs font-semibold flex items-center gap-1 ${
                savedBytes >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {savedBytes >= 0
                  ? `-${savedPct.toFixed(1)}%`
                  : `+${Math.abs(savedPct).toFixed(1)}%`}
              </span>
            </div>
          )}
        </div>

        {/* Primary & Secondary Export Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!result || isProcessing}
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 text-white font-medium text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {t.panel.downloadBtnPrefix} (.
              {getExtensionForFormat(options.outputFormat)})
            </span>
          </button>

          <button
            type="button"
            disabled={!result || isProcessing}
            onClick={handleCopyResult}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 active:scale-[0.99] disabled:opacity-40 text-stone-800 border border-stone-200/90 font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">{t.panel.copiedToast}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-600" />
                <span>
                  {options.outputFormat === 'svg'
                    ? t.panel.copySvgBtn
                    : t.panel.copyImageBtn}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
