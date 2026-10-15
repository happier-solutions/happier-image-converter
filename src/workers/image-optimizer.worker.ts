/// <reference lib="webworker" />

import { optimize as optimizeSvg } from 'svgo/browser'
import encodeJpeg from '@jsquash/jpeg/encode.js'
import optimisePng from '@jsquash/oxipng/optimise.js'
import encodeWebp from '@jsquash/webp/encode.js'
import encodeAvif from '@jsquash/avif/encode.js'
import resizeImage from '@jsquash/resize'
import type { WorkerRequest, WorkerResponse } from '../types/image'

declare const self: DedicatedWorkerGlobalScope

async function fallbackEncodeWithOffscreenCanvas(
  imageData: ImageData,
  mimeType: string,
  quality: number,
): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not initialize 2D context on OffscreenCanvas')
  }
  ctx.putImageData(imageData, 0, 0)
  const blob = await canvas.convertToBlob({
    type: mimeType,
    quality: Math.max(0.01, Math.min(1, quality / 100)),
  })
  return blob.arrayBuffer()
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data
  const startTime = performance.now()

  try {
    if (req.kind === 'svg') {
      const { multipass, floatPrecision, removeViewBox, cleanupIds } = req.options

      const plugins: any[] = [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupIds: cleanupIds ? undefined : false,
              cleanupNumericValues: {
                floatPrecision,
              },
              convertPathData: {
                floatPrecision,
              },
            },
          },
        },
      ]

      if (removeViewBox) {
        plugins.push('removeViewBox')
      }

      const result = optimizeSvg(req.svgText, {
        multipass,
        plugins,
      })

      const durationMs = Math.round(performance.now() - startTime)
      const response: WorkerResponse = {
        id: req.id,
        success: true,
        kind: 'svg',
        svgText: result.data,
        width: 0,
        height: 0,
        mimeType: 'image/svg+xml',
        engineLabel: `SVGO v4 · Precision ${floatPrecision}${multipass ? ' · Multipass' : ''}`,
        durationMs,
      }
      self.postMessage(response)
      return
    }

    // Raster pipeline
    let workingData = req.imageData
    const {
      resizeEnabled,
      targetWidth,
      targetHeight,
      jpegQuality,
      pngLevel,
      webpQuality,
      webpLossless,
      avifQuality,
      avifSpeed,
    } = req.options

    if (
      resizeEnabled &&
      targetWidth > 0 &&
      targetHeight > 0 &&
      (targetWidth !== workingData.width || targetHeight !== workingData.height)
    ) {
      try {
        workingData = await resizeImage(workingData, {
          width: Math.round(targetWidth),
          height: Math.round(targetHeight),
        })
      } catch {
        // Fallback high-quality OffscreenCanvas resize
        const srcCanvas = new OffscreenCanvas(workingData.width, workingData.height)
        const srcCtx = srcCanvas.getContext('2d')!
        srcCtx.putImageData(workingData, 0, 0)

        const dstCanvas = new OffscreenCanvas(
          Math.round(targetWidth),
          Math.round(targetHeight),
        )
        const dstCtx = dstCanvas.getContext('2d')!
        dstCtx.imageSmoothingEnabled = true
        dstCtx.imageSmoothingQuality = 'high'
        dstCtx.drawImage(
          srcCanvas,
          0,
          0,
          Math.round(targetWidth),
          Math.round(targetHeight),
        )
        workingData = dstCtx.getImageData(
          0,
          0,
          Math.round(targetWidth),
          Math.round(targetHeight),
        )
      }
    }

    let buffer: ArrayBuffer
    let mimeType = 'image/png'
    let engineLabel = ''

    switch (req.outputFormat) {
      case 'jpeg': {
        mimeType = 'image/jpeg'
        try {
          buffer = await encodeJpeg(workingData, {
            quality: jpegQuality,
          })
          engineLabel = `MozJPEG WASM · Q${jpegQuality}`
        } catch {
          buffer = await fallbackEncodeWithOffscreenCanvas(
            workingData,
            mimeType,
            jpegQuality,
          )
          engineLabel = `Canvas JPEG · Q${jpegQuality}`
        }
        break
      }

      case 'png': {
        mimeType = 'image/png'
        try {
          buffer = await optimisePng(workingData, {
            level: pngLevel,
            interlace: false,
            optimiseAlpha: true,
          })
          engineLabel = `OxiPNG WASM · Level ${pngLevel}`
        } catch {
          buffer = await fallbackEncodeWithOffscreenCanvas(workingData, mimeType, 95)
          engineLabel = 'Canvas PNG'
        }
        break
      }

      case 'webp': {
        mimeType = 'image/webp'
        try {
          buffer = await encodeWebp(workingData, {
            quality: webpQuality,
            lossless: webpLossless ? 1 : 0,
          })
          engineLabel = `libwebp WASM · ${webpLossless ? 'Lossless' : `Q${webpQuality}`}`
        } catch {
          buffer = await fallbackEncodeWithOffscreenCanvas(
            workingData,
            mimeType,
            webpLossless ? 100 : webpQuality,
          )
          engineLabel = `Canvas WebP · Q${webpQuality}`
        }
        break
      }

      case 'avif': {
        mimeType = 'image/avif'
        try {
          buffer = await encodeAvif(workingData, {
            quality: avifQuality,
            speed: avifSpeed,
          })
          engineLabel = `libavif WASM · Q${avifQuality} · Spd ${avifSpeed}`
        } catch {
          buffer = await fallbackEncodeWithOffscreenCanvas(
            workingData,
            mimeType,
            avifQuality,
          )
          engineLabel = `Browser AVIF · Q${avifQuality}`
        }
        break
      }
    }

    const durationMs = Math.round(performance.now() - startTime)
    const response: WorkerResponse = {
      id: req.id,
      success: true,
      kind: 'raster',
      buffer,
      width: workingData.width,
      height: workingData.height,
      mimeType,
      engineLabel,
      durationMs,
    }
    self.postMessage(response, [buffer])
  } catch (err: any) {
    const response: WorkerResponse = {
      id: req.id,
      success: false,
      error: err?.message || 'Unknown optimization error',
    }
    self.postMessage(response)
  }
}
