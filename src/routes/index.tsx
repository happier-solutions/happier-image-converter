import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ClipboardPaste,
  FolderOpen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { DropPasteZone } from '../components/DropPasteZone'
import { CompareSlider } from '../components/CompareSlider'
import { OptimizationPanel } from '../components/OptimizationPanel'
import { AppLogoIcon } from '../components/AppLogoIcon'
import {
  LanguageSuggestionBanner,
  LanguageSwitcher,
} from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'
import {
  createSampleAsset,
  decodeSourceToImageData,
  formatBytes,
  isLikelySvgText,
  loadSourceFromFile,
  loadSourceFromSvgString,
  readFromClipboardApi,
} from '../lib/image-decoder'
import type {
  OptimizationOptions,
  OptimizedResult,
  SourceImageItem,
  WorkerRequest,
  WorkerResponse,
} from '../types/image'

export const Route = createFileRoute('/')({
  ssr: false,
  component: CraftImageStudioPage,
})

const DEFAULT_OPTIONS: OptimizationOptions = {
  outputFormat: 'webp',
  resizeEnabled: false,
  targetWidth: 800,
  targetHeight: 600,
  maintainAspectRatio: true,
  svgScale: 2,
  backgroundFill: '#FFFFFF',
  jpegQuality: 78,
  pngLevel: 3,
  webpQuality: 80,
  webpLossless: false,
  avifQuality: 65,
  avifSpeed: 6,
  svgMultipass: true,
  svgFloatPrecision: 2,
  svgRemoveViewBox: false,
  svgCleanupIds: true,
}

function CraftImageStudioPage() {
  const { t } = useI18n()
  const [source, setSource] = useState<SourceImageItem | null>(null)
  const [options, setOptions] = useState<OptimizationOptions>(DEFAULT_OPTIONS)
  const [result, setResult] = useState<OptimizedResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingSource, setIsLoadingSource] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const quickFileInputRef = useRef<HTMLInputElement>(null)

  // Initialize Web Worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/image-optimizer.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const res = event.data
      if (res.id !== requestIdRef.current) {
        return
      }

      if (!res.success) {
        setErrorMessage(res.error)
        setIsProcessing(false)
        return
      }

      if (res.kind === 'svg' && res.svgText !== undefined) {
        let previewSvg = res.svgText
        if (!previewSvg.includes('xmlns=')) {
          previewSvg = previewSvg.replace(
            /<svg\b/i,
            '<svg xmlns="http://www.w3.org/2000/svg"',
          )
        }
        const blob = new Blob([previewSvg], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        setResult({
          blob,
          url,
          size: new Blob([res.svgText], { type: 'image/svg+xml' }).size,
          width: 0,
          height: 0,
          format: 'svg',
          mimeType: 'image/svg+xml',
          durationMs: res.durationMs,
          svgText: res.svgText,
          engineLabel: res.engineLabel,
        })
        setIsProcessing(false)
        return
      }

      if (res.kind === 'raster' && res.buffer) {
        const blob = new Blob([res.buffer], { type: res.mimeType })
        const url = URL.createObjectURL(blob)
        const formatMap: Record<string, OptimizedResult['format']> = {
          'image/jpeg': 'jpeg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/avif': 'avif',
        }
        setResult({
          blob,
          url,
          size: blob.size,
          width: res.width,
          height: res.height,
          format: formatMap[res.mimeType] || 'png',
          mimeType: res.mimeType,
          durationMs: res.durationMs,
          engineLabel: res.engineLabel,
        })
        setIsProcessing(false)
      }
    }

    return () => {
      worker.terminate()
    }
  }, [])

  const applyNewSource = useCallback((item: SourceImageItem) => {
    setErrorMessage(null)
    setSource(item)
    setResult(null)

    setOptions((prev) => ({
      ...prev,
      outputFormat: item.format,
      resizeEnabled: false,
      targetWidth: item.width,
      targetHeight: item.height,
      svgScale: item.format === 'svg' ? 2 : 1,
    }))
  }, [])

  const handleSelectFile = useCallback(
    async (file: File) => {
      setIsLoadingSource(true)
      setErrorMessage(null)
      try {
        const item = await loadSourceFromFile(file, 'upload')
        applyNewSource(item)
      } catch {
        setErrorMessage(t.errors.unsupportedFormat)
      } finally {
        setIsLoadingSource(false)
      }
    },
    [applyNewSource, t.errors.unsupportedFormat],
  )

  const handlePasteRawSvgText = useCallback(
    async (svgCode: string) => {
      setIsLoadingSource(true)
      setErrorMessage(null)
      try {
        const item = await loadSourceFromSvgString(
          svgCode,
          'pasted-vector.svg',
          'clipboard',
        )
        applyNewSource(item)
      } catch {
        setErrorMessage(t.errors.invalidSvg)
      } finally {
        setIsLoadingSource(false)
      }
    },
    [applyNewSource, t.errors.invalidSvg],
  )

  const handlePasteClipboardButton = useCallback(async () => {
    setIsLoadingSource(true)
    setErrorMessage(null)
    try {
      const item = await readFromClipboardApi()
      applyNewSource(item)
    } catch {
      setErrorMessage(t.errors.clipboardEmpty)
    } finally {
      setIsLoadingSource(false)
    }
  }, [applyNewSource, t.errors.clipboardEmpty])

  const handleSelectSample = useCallback(
    async (kind: 'svg' | 'png' | 'jpeg') => {
      setIsLoadingSource(true)
      setErrorMessage(null)
      try {
        const item = await createSampleAsset(kind)
        applyNewSource(item)
      } catch {
        setErrorMessage(t.errors.sampleFailed)
      } finally {
        setIsLoadingSource(false)
      }
    },
    [applyNewSource, t.errors.sampleFailed],
  )

  // Global Cmd+V / Ctrl+V paste handler anywhere on the page
  useEffect(() => {
    const onGlobalPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            setIsLoadingSource(true)
            try {
              const loaded = await loadSourceFromFile(file, 'clipboard')
              applyNewSource(loaded)
            } catch {
              setErrorMessage(t.errors.pasteImageFailed)
            } finally {
              setIsLoadingSource(false)
            }
            return
          }
        }
      }

      const plainText = e.clipboardData?.getData('text/plain')
      if (plainText && isLikelySvgText(plainText)) {
        e.preventDefault()
        handlePasteRawSvgText(plainText)
      }
    }

    window.addEventListener('paste', onGlobalPaste)
    return () => window.removeEventListener('paste', onGlobalPaste)
  }, [applyNewSource, handlePasteRawSvgText, t.errors.pasteImageFailed])

  // Trigger optimization in Web Worker whenever source or options change
  useEffect(() => {
    if (!source || !workerRef.current) return

    const timer = setTimeout(async () => {
      const currentReqId = ++requestIdRef.current
      setIsProcessing(true)
      setErrorMessage(null)

      try {
        if (options.outputFormat === 'svg' && source.format === 'svg') {
          const msg: WorkerRequest = {
            id: currentReqId,
            kind: 'svg',
            svgText: source.svgText || '',
            options: {
              multipass: options.svgMultipass,
              floatPrecision: options.svgFloatPrecision,
              removeViewBox: options.svgRemoveViewBox,
              cleanupIds: options.svgCleanupIds,
            },
          }
          workerRef.current?.postMessage(msg)
          return
        }

        const fillBackground =
          options.outputFormat === 'jpeg' ? options.backgroundFill : null
        const imageData = await decodeSourceToImageData(source, {
          svgScale: options.svgScale,
          fillBackground,
        })

        if (currentReqId !== requestIdRef.current) return

        const msg: WorkerRequest = {
          id: currentReqId,
          kind: 'raster',
          imageData,
          outputFormat:
            options.outputFormat === 'svg' ? 'png' : options.outputFormat,
          options: {
            resizeEnabled: options.resizeEnabled,
            targetWidth: options.targetWidth,
            targetHeight: options.targetHeight,
            jpegQuality: options.jpegQuality,
            pngLevel: options.pngLevel,
            webpQuality: options.webpQuality,
            webpLossless: options.webpLossless,
            avifQuality: options.avifQuality,
            avifSpeed: options.avifSpeed,
          },
        }
        workerRef.current?.postMessage(msg)
      } catch {
        if (currentReqId === requestIdRef.current) {
          setErrorMessage(t.errors.processFailed)
          setIsProcessing(false)
        }
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [source, options, t.errors.processFailed])

  return (
    <div className="min-h-screen flex flex-col">
      <LanguageSuggestionBanner />

      {/* Craft.do Floating Top Pill Header */}
      <header className="sticky top-0 z-40 px-4 pt-3.5 pb-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left Brand Pill (Click to return Home) */}
          <button
            type="button"
            onClick={() => {
              setSource(null)
              setResult(null)
              setErrorMessage(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="craft-panel rounded-full pl-2.5 pr-4 py-1.5 flex items-center gap-2.5 hover:bg-white/95 active:scale-[0.99] transition cursor-pointer"
          >
            <AppLogoIcon className="w-7 h-7 shrink-0 shadow-2xs rounded-lg" />
            <div className="flex items-baseline gap-2">
              <span className="font-serif-editorial text-xl tracking-tight text-stone-900">
                Happier Image
              </span>
            </div>
          </button>

          {/* Center Active File Document Pill (only when editing) */}
          {source && (
            <div className="craft-panel rounded-full px-4 py-1.5 hidden md:flex items-center gap-2.5 text-xs">
              <span className="font-medium text-stone-800 truncate max-w-[200px]">
                {source.name}
              </span>
              <span className="text-stone-300">·</span>
              <span className="font-mono-tabular text-stone-500">
                {formatBytes(source.size)}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium text-[11px]">
                {source.sourceOrigin === 'clipboard'
                  ? t.header.originClipboard
                  : source.sourceOrigin === 'sample'
                    ? t.header.originSample
                    : t.header.originUpload}
              </span>
            </div>
          )}

          {/* Right Action Pill + Language Switcher */}
          <div className="craft-panel rounded-full p-1.5 flex items-center gap-1">
            <input
              ref={quickFileInputRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleSelectFile(file)
                e.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={handlePasteClipboardButton}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 hover:bg-stone-100/90 transition cursor-pointer"
              title={t.header.pasteTooltip}
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.header.pasteShortcut}</span>
            </button>

            {source ? (
              <>
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 hover:bg-stone-100/90 transition cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-stone-600" />
                  <span className="hidden sm:inline">{t.header.changeImage}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSource(null)
                    setResult(null)
                    setErrorMessage(null)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.header.resetNew}</span>
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{t.header.offlineReady}</span>
              </div>
            )}

            <div className="w-[1px] h-4 bg-stone-200/90 mx-0.5" />

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col justify-center">
        {!source ? (
          <DropPasteZone
            onSelectFile={handleSelectFile}
            onPasteClipboardButton={handlePasteClipboardButton}
            onPasteRawSvgText={handlePasteRawSvgText}
            onSelectSample={handleSelectSample}
            isLoading={isLoadingSource}
            errorMessage={errorMessage}
          />
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 py-4 flex-1 flex flex-col">
            {errorMessage && (
              <div className="mb-3 px-4 py-2.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="font-semibold underline ml-4 cursor-pointer"
                >
                  {t.hero.closeBtn}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
              {/* Left 8 Columns: Craft Canvas & Split Slider */}
              <div className="lg:col-span-8 flex flex-col">
                <CompareSlider
                  source={source}
                  result={result}
                  isProcessing={isProcessing}
                />
              </div>

              {/* Right 4 Columns: Craft Floating Bento Inspector */}
              <div className="lg:col-span-4 flex flex-col">
                <OptimizationPanel
                  source={source}
                  options={options}
                  onChangeOptions={setOptions}
                  result={result}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
