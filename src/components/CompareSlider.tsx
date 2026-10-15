import React, { useCallback, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  Code2,
  Columns2,
  Eye,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { formatBytes } from '../lib/image-decoder'
import { useI18n } from '../i18n'
import type { OptimizedResult, SourceImageItem } from '../types/image'

interface CompareSliderProps {
  source: SourceImageItem
  result: OptimizedResult | null
  isProcessing: boolean
}

type BackdropMode = 'checker' | 'paper' | 'dark'
type ViewMode = 'split' | 'side-by-side' | 'svg-code'

export function CompareSlider({
  source,
  result,
  isProcessing,
}: CompareSliderProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [backdrop, setBackdrop] = useState<BackdropMode>('checker')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [zoom, setZoom] = useState<number>(1)

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setSliderPos(Math.max(2, Math.min(98, pct)))
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode !== 'split') return
    setIsDragging(true)
    updateSliderFromClientX(e.clientX)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || viewMode !== 'split') return
    updateSliderFromClientX(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const backdropClass =
    backdrop === 'checker'
      ? 'craft-checkerboard'
      : backdrop === 'dark'
        ? 'craft-checkerboard-dark'
        : 'bg-[#FAF9F5]'

  const canInspectSvgCode =
    source.format === 'svg' || (result && result.format === 'svg')

  // Compute bounded display dimensions so SVGs with only viewBox never collapse to 0x0
  const maxStageWidth = 680
  const maxStageHeight = 400
  const rawW = source.width || 640
  const rawH = source.height || 640
  const fitScale = Math.min(maxStageWidth / rawW, maxStageHeight / rawH, 1)
  const displayWidth = Math.max(180, Math.round(rawW * fitScale))
  const displayHeight = Math.max(180, Math.round(rawH * fitScale))

  return (
    <div className="flex flex-col h-full">
      {/* Main Craft Canvas Card */}
      <div
        className={`craft-panel rounded-[28px] relative flex-1 min-h-[440px] sm:min-h-[540px] overflow-hidden flex flex-col justify-between transition-colors ${backdropClass}`}
      >
        {/* Top Floating Status Pills */}
        <div className="relative z-20 flex items-center justify-between gap-2 p-4 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/90 shadow-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-stone-400" />
            <span className="font-medium text-stone-600">
              {t.compare.originalBadge}
            </span>
            <span className="uppercase font-mono-tabular font-semibold text-stone-900 px-1.5 py-0.5 rounded bg-stone-100">
              {source.format === 'jpeg' ? 'JPG' : source.format}
            </span>
            <span className="font-mono-tabular text-stone-700 font-medium">
              {formatBytes(source.size)}
            </span>
            <span className="text-stone-400 hidden sm:inline font-mono-tabular">
              · {source.width}×{source.height}
            </span>
          </div>

          {result && (
            <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/92 backdrop-blur-md text-white shadow-md text-xs">
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
              <span className="font-medium text-stone-300">
                {t.compare.optimizedBadge}
              </span>
              <span className="uppercase font-mono-tabular font-semibold text-emerald-300 px-1.5 py-0.5 rounded bg-white/10">
                {result.format === 'jpeg' ? 'JPG' : result.format}
              </span>
              <span className="font-mono-tabular font-semibold text-white">
                {formatBytes(result.size)}
              </span>
              {result.width > 0 && (
                <span className="text-stone-400 hidden sm:inline font-mono-tabular">
                  · {result.width}×{result.height}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center Comparison Viewport */}
        {viewMode === 'svg-code' && canInspectSvgCode ? (
          <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-16 overflow-hidden">
            <div className="rounded-2xl bg-white/95 border border-stone-200/90 p-3.5 flex flex-col overflow-hidden shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 text-xs">
                <span className="font-semibold text-stone-700">
                  {t.compare.svgOriginalHeader} ({formatBytes(source.size)})
                </span>
                <span className="font-mono-tabular text-stone-400">
                  {source.svgText?.length.toLocaleString()} {t.compare.charsUnit}
                </span>
              </div>
              <pre className="flex-1 overflow-auto font-mono-tabular text-[11px] leading-relaxed text-stone-600 select-all whitespace-pre-wrap break-all">
                {source.svgText || t.compare.noSvgSource}
              </pre>
            </div>

            <div className="rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 p-3.5 flex flex-col overflow-hidden shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-xs">
                <span className="font-semibold text-emerald-400">
                  {t.compare.svgOptimizedHeader} (
                  {result ? formatBytes(result.size) : '...'})
                </span>
                <span className="font-mono-tabular text-stone-400">
                  {result?.svgText
                    ? `${result.svgText.length.toLocaleString()} ${t.compare.charsUnit}`
                    : t.compare.exportingRasterNote}
                </span>
              </div>
              <pre className="flex-1 overflow-auto font-mono-tabular text-[11px] leading-relaxed text-emerald-100/90 select-all whitespace-pre-wrap break-all">
                {result?.svgText || t.compare.svgRasterSwitchHint}
              </pre>
            </div>
          </div>
        ) : viewMode === 'side-by-side' ? (
          <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pb-16 items-center justify-items-center overflow-auto">
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <img
                src={source.url}
                alt="Original"
                width={displayWidth}
                height={displayHeight}
                style={{
                  width: `${Math.round(displayWidth * 0.75)}px`,
                  height: `${Math.round(displayHeight * 0.75)}px`,
                  transform: `scale(${zoom})`,
                }}
                className="object-contain rounded-lg transition-transform duration-150 select-none"
                draggable={false}
              />
              <span className="mt-2 text-[11px] font-medium text-stone-500 bg-white/80 px-2.5 py-0.5 rounded-full">
                {t.compare.originalCaption} ({formatBytes(source.size)})
              </span>
            </div>
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              {result ? (
                <img
                  src={result.url}
                  alt="Optimized"
                  width={displayWidth}
                  height={displayHeight}
                  style={{
                    width: `${Math.round(displayWidth * 0.75)}px`,
                    height: `${Math.round(displayHeight * 0.75)}px`,
                    transform: `scale(${zoom})`,
                  }}
                  className="object-contain rounded-lg transition-transform duration-150 select-none"
                  draggable={false}
                />
              ) : (
                <div className="text-xs text-stone-400">
                  {t.compare.processingShort}
                </div>
              )}
              {result && (
                <span className="mt-2 text-[11px] font-medium text-stone-700 bg-white/80 px-2.5 py-0.5 rounded-full">
                  {t.compare.optimizedCaption} ({formatBytes(result.size)})
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Interactive Split Slider Mode */
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative z-10 flex-1 min-h-[380px] select-none cursor-ew-resize overflow-hidden"
          >
            {/* Layer 1 (Base / Right side): Optimized Image */}
            <div className="absolute inset-0 flex items-center justify-center p-6 pb-16 pointer-events-none">
              <img
                src={result ? result.url : source.url}
                alt="Optimized preview"
                width={displayWidth}
                height={displayHeight}
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  transform: `scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease',
                }}
                className="object-contain pointer-events-none select-none block"
                draggable={false}
              />
            </div>

            {/* Layer 2 (Clipped Overlay / Left side): Original Image */}
            <div
              className="absolute inset-0 flex items-center justify-center p-6 pb-16 pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
              }}
            >
              <img
                src={source.url}
                alt="Original preview"
                width={displayWidth}
                height={displayHeight}
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  transform: `scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease',
                }}
                className="object-contain pointer-events-none select-none block"
                draggable={false}
              />
            </div>

            {/* Layer 3: Vertical Split Divider Line & Tactile Handle */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_0_1px_rgba(24,24,27,0.18),0_0_16px_rgba(0,0,0,0.2)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-lg flex items-center justify-center text-stone-800">
                <ArrowLeftRight className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay Badge */}
        {isProcessing && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>{t.compare.processingWorker}</span>
          </div>
        )}

        {/* Bottom Craft Floating Dock */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-4 pb-3.5 pt-2">
          {/* View Mode Segmented Control */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200/90 shadow-xs text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.compare.modeSplit}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                viewMode === 'side-by-side'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{t.compare.modeSideBySide}</span>
            </button>

            {canInspectSvgCode && (
              <button
                type="button"
                onClick={() => setViewMode('svg-code')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  viewMode === 'svg-code'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{t.compare.modeSvgCode}</span>
              </button>
            )}
          </div>

          {/* Right Dock: Backdrop & Zoom */}
          <div className="inline-flex items-center gap-2">
            {/* Backdrop selector */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200/90 shadow-xs text-xs">
              <button
                type="button"
                onClick={() => setBackdrop('checker')}
                className={`px-2.5 py-1 rounded-xl font-medium transition cursor-pointer ${
                  backdrop === 'checker'
                    ? 'bg-stone-200/80 text-stone-900'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.compare.backdropChecker}
              </button>
              <button
                type="button"
                onClick={() => setBackdrop('paper')}
                className={`px-2.5 py-1 rounded-xl font-medium transition cursor-pointer ${
                  backdrop === 'paper'
                    ? 'bg-stone-200/80 text-stone-900'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.compare.backdropPaper}
              </button>
              <button
                type="button"
                onClick={() => setBackdrop('dark')}
                className={`px-2.5 py-1 rounded-xl font-medium transition cursor-pointer ${
                  backdrop === 'dark'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.compare.backdropDark}
              </button>
            </div>

            {/* Zoom Pill */}
            {viewMode !== 'svg-code' && (
              <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200/90 shadow-xs text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))
                  }
                  className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
                  title={t.compare.zoomOutTitle}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-2 font-mono-tabular font-medium text-stone-700 hover:text-stone-900 cursor-pointer"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))
                  }
                  className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
                  title={t.compare.zoomInTitle}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
