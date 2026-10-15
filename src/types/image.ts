export type InputFormat = 'svg' | 'png' | 'jpeg' | 'webp'

export type OutputFormat = 'svg' | 'png' | 'jpeg' | 'webp' | 'avif'

export interface SourceImageItem {
  id: string
  name: string
  format: InputFormat
  mimeType: string
  size: number
  width: number
  height: number
  url: string
  file: File
  svgText?: string
  sourceOrigin: 'upload' | 'clipboard' | 'sample'
}

export interface OptimizationOptions {
  outputFormat: OutputFormat
  // Dimensions & Resize
  resizeEnabled: boolean
  targetWidth: number
  targetHeight: number
  maintainAspectRatio: boolean
  // SVG -> Raster scale (1x, 2x, 3x, 4x)
  svgScale: number
  // Transparent fill when converting to JPEG
  backgroundFill: string
  // JPEG (MozJPEG)
  jpegQuality: number
  // PNG (OxiPNG)
  pngLevel: number
  // WebP
  webpQuality: number
  webpLossless: boolean
  // AVIF
  avifQuality: number
  avifSpeed: number
  // SVG (SVGO)
  svgMultipass: boolean
  svgFloatPrecision: number
  svgRemoveViewBox: boolean
  svgCleanupIds: boolean
}

export interface OptimizedResult {
  blob: Blob
  url: string
  size: number
  width: number
  height: number
  format: OutputFormat
  mimeType: string
  durationMs: number
  svgText?: string
  engineLabel: string
}

export interface WorkerOptimizeSvgRequest {
  id: number
  kind: 'svg'
  svgText: string
  options: {
    multipass: boolean
    floatPrecision: number
    removeViewBox: boolean
    cleanupIds: boolean
  }
}

export interface WorkerOptimizeRasterRequest {
  id: number
  kind: 'raster'
  imageData: ImageData
  outputFormat: Exclude<OutputFormat, 'svg'>
  options: {
    resizeEnabled: boolean
    targetWidth: number
    targetHeight: number
    jpegQuality: number
    pngLevel: number
    webpQuality: number
    webpLossless: boolean
    avifQuality: number
    avifSpeed: number
  }
}

export type WorkerRequest =
  | WorkerOptimizeSvgRequest
  | WorkerOptimizeRasterRequest

export interface WorkerSuccessResponse {
  id: number
  success: true
  kind: 'svg' | 'raster'
  buffer?: ArrayBuffer
  svgText?: string
  width: number
  height: number
  mimeType: string
  engineLabel: string
  durationMs: number
}

export interface WorkerErrorResponse {
  id: number
  success: false
  error: string
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse
