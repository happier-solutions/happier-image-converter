import type {
  InputFormat,
  OutputFormat,
  SourceImageItem,
} from '../types/image'

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${sizes[i]}`
}

export function getExtensionForFormat(format: OutputFormat): string {
  switch (format) {
    case 'jpeg':
      return 'jpg'
    case 'svg':
      return 'svg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'avif':
      return 'avif'
  }
}

export function detectFormatFromFile(file: File): InputFormat | null {
  const mime = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (mime.includes('svg') || name.endsWith('.svg')) return 'svg'
  if (mime.includes('png') || name.endsWith('.png')) return 'png'
  if (
    mime.includes('jpeg') ||
    mime.includes('jpg') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  ) {
    return 'jpeg'
  }
  if (mime.includes('webp') || name.endsWith('.webp')) return 'webp'
  return null
}

export function isLikelySvgText(text: string): boolean {
  const trimmed = text.trim()
  return (
    (trimmed.startsWith('<svg') ||
      (trimmed.startsWith('<?xml') && trimmed.includes('<svg')) ||
      (trimmed.startsWith('<!--') && trimmed.includes('<svg'))) &&
    trimmed.includes('</svg>')
  )
}

export async function loadSourceFromFile(
  file: File,
  sourceOrigin: SourceImageItem['sourceOrigin'] = 'upload',
): Promise<SourceImageItem> {
  let format = detectFormatFromFile(file)
  let svgText: string | undefined

  if (!format && file.type.startsWith('text/')) {
    const text = await file.text()
    if (isLikelySvgText(text)) {
      format = 'svg'
      svgText = text
    }
  }

  if (!format) {
    throw new Error(
      'Định dạng không hỗ trợ. Vui lòng chọn hoặc dán ảnh SVG, PNG, JPG hoặc WebP.',
    )
  }

  if (format === 'svg' && !svgText) {
    svgText = await file.text()
  }

  if (format === 'svg' && svgText && !svgText.includes('xmlns=')) {
    svgText = svgText.replace(
      /<svg\b/i,
      '<svg xmlns="http://www.w3.org/2000/svg"',
    )
  }

  const normalizedFile =
    format === 'svg' && svgText
      ? new File([svgText], file.name.endsWith('.svg') ? file.name : 'pasted-vector.svg', {
          type: 'image/svg+xml',
        })
      : file

  const url = URL.createObjectURL(normalizedFile)
  const dimensions = await measureImageDimensions(url, svgText)

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: normalizedFile.name || `clipboard-image.${format === 'jpeg' ? 'jpg' : format}`,
    format,
    mimeType: normalizedFile.type || `image/${format}`,
    size: normalizedFile.size,
    width: dimensions.width,
    height: dimensions.height,
    url,
    file: normalizedFile,
    svgText,
    sourceOrigin,
  }
}

export async function loadSourceFromSvgString(
  rawSvg: string,
  name = 'clipboard-vector.svg',
  sourceOrigin: SourceImageItem['sourceOrigin'] = 'clipboard',
): Promise<SourceImageItem> {
  const file = new File([rawSvg], name, { type: 'image/svg+xml' })
  return loadSourceFromFile(file, sourceOrigin)
}

export function measureImageDimensions(
  url: string,
  svgText?: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let width = img.naturalWidth || img.width
      let height = img.naturalHeight || img.height

      if ((!width || !height) && svgText) {
        const viewBoxMatch = svgText.match(
          /viewBox=["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i,
        )
        if (viewBoxMatch) {
          width = Math.round(parseFloat(viewBoxMatch[1]))
          height = Math.round(parseFloat(viewBoxMatch[2]))
        }
      }

      resolve({
        width: width || 800,
        height: height || 600,
      })
    }
    img.onerror = () => {
      resolve({ width: 800, height: 600 })
    }
    img.src = url
  })
}

export async function decodeSourceToImageData(
  source: SourceImageItem,
  options: {
    svgScale: number
    fillBackground: string | null
  },
): Promise<ImageData> {
  const scale = source.format === 'svg' ? Math.max(1, options.svgScale) : 1
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.crossOrigin = 'anonymous'
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Không thể giải mã hình ảnh trên trình duyệt'))
    element.src = source.url
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Không thể khởi tạo Canvas 2D')
  }

  if (options.fillBackground) {
    ctx.fillStyle = options.fillBackground
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.clearRect(0, 0, width, height)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  return ctx.getImageData(0, 0, width, height)
}

export async function readFromClipboardApi(): Promise<SourceImageItem> {
  if (navigator.clipboard && 'read' in navigator.clipboard) {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const svgType = item.types.find((t) => t.includes('svg'))
        if (svgType) {
          const blob = await item.getType(svgType)
          const text = await blob.text()
          if (isLikelySvgText(text)) {
            return loadSourceFromSvgString(text, 'clipboard-vector.svg', 'clipboard')
          }
        }

        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const ext = imageType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
          const file = new File([blob], `clipboard-${Date.now()}.${ext}`, {
            type: imageType,
          })
          return loadSourceFromFile(file, 'clipboard')
        }

        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain')
          const text = await blob.text()
          if (isLikelySvgText(text)) {
            return loadSourceFromSvgString(text, 'clipboard-vector.svg', 'clipboard')
          }
        }
      }
    } catch {
      // Fallback to readText below if permission for binary read fails
    }
  }

  if (navigator.clipboard && 'readText' in navigator.clipboard) {
    const text = await navigator.clipboard.readText()
    if (isLikelySvgText(text)) {
      return loadSourceFromSvgString(text, 'clipboard-vector.svg', 'clipboard')
    }
  }

  throw new Error(
    'Không tìm thấy ảnh hoặc mã <svg> trong Clipboard. Bạn có thể nhấn ⌘V / Ctrl+V trực tiếp trên trang.',
  )
}

// Built-in rich samples for 1-click Craft Studio testing
export async function createSampleAsset(
  kind: 'svg' | 'png' | 'jpeg',
): Promise<SourceImageItem> {
  if (kind === 'svg') {
    const verboseSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Adobe Illustrator 28.4.0, SVG Export Plug-In . SVG Version: 6.00 Build 0) -->
<!-- Craft Studio Vector Sample with redundant metadata, comments, and high-precision floats -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1_Craft_Illustration_Asset" x="0px" y="0px" width="720px" height="520px" viewBox="0 0 720 520" style="enable-background:new 0 0 720 520;" xml:space="preserve">
  <metadata id="CorelCorpID_0Corel-Layer">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about="https://craft.do/sample-vector-metadata-block-that-svgo-will-strip-cleanly">
        <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Craft Editorial Botanical Card</dc:title>
        <dc:description xmlns:dc="http://purl.org/dc/elements/1.1/">Unoptimized vector graphic containing extra decimal precision, unused groups, comments, and editor metadata for local SVGO testing.</dc:description>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  <defs id="unused_defs_container_001">
    <linearGradient id="bgGrad_001" x1="0.0000000%" y1="0.0000000%" x2="100.0000000%" y2="100.0000000%">
      <stop offset="0.000000%" stop-color="#FDFCFB" stop-opacity="1.000000"/>
      <stop offset="52.481920%" stop-color="#F5F2EB" stop-opacity="1.000000"/>
      <stop offset="100.000000%" stop-color="#EBE5D9" stop-opacity="1.000000"/>
    </linearGradient>
    <linearGradient id="accentOrb_002" x1="12.345678%" y1="8.765432%" x2="88.123456%" y2="92.654321%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="50%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#0F766E"/>
    </linearGradient>
    <linearGradient id="warmTerracotta_003" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
  </defs>
  <g id="Background_Layer_Wrapper">
    <rect id="card_base_rect" x="24.000000" y="24.000000" width="672.000000" height="472.000000" rx="36.000000" fill="url(#bgGrad_001)" stroke="#D6D3CD" stroke-width="2.000000"/>
    <circle id="sun_orb" cx="536.248912" cy="158.839201" r="84.500000" fill="url(#warmTerracotta_003)" opacity="0.880000"/>
    <circle id="emerald_orb" cx="218.491023" cy="312.748291" r="112.250000" fill="url(#accentOrb_002)" opacity="0.920000"/>
  </g>
  <g id="Editorial_Geometry_Group">
    <path id="wave_curve_01" d="M 64.123456 382.987654 C 168.456789 264.123456, 294.789123 442.654321, 412.345678 318.876543 C 512.987654 214.321098, 588.123456 320.456789, 656.000000 248.123456" fill="none" stroke="#18181B" stroke-width="5.500000" stroke-linecap="round"/>
    <path id="wave_curve_02" d="M 64.123456 418.987654 C 188.456789 314.123456, 314.789123 468.654321, 432.345678 354.876543 C 532.987654 254.321098, 598.123456 350.456789, 656.000000 292.123456" fill="none" stroke="#78716C" stroke-width="2.500000" stroke-dasharray="8.000000 8.000000" stroke-linecap="round"/>
    <rect id="floating_glass_card" x="242.000000" y="114.000000" width="248.000000" height="264.000000" rx="28.000000" fill="#FFFFFF" fill-opacity="0.860000" stroke="#18181B" stroke-width="2.000000"/>
    <line x1="278.12345" y1="168.54321" x2="412.98765" y2="168.54321" stroke="#18181B" stroke-width="8.00000" stroke-linecap="round"/>
    <line x1="278.12345" y1="202.54321" x2="452.98765" y2="202.54321" stroke="#A8A29E" stroke-width="5.00000" stroke-linecap="round"/>
    <line x1="278.12345" y1="228.54321" x2="436.98765" y2="228.54321" stroke="#A8A29E" stroke-width="5.00000" stroke-linecap="round"/>
    <circle cx="314.000000" cy="304.000000" r="28.000000" fill="#18181B"/>
    <path d="M 304.500000 304.500000 L 311.500000 311.500000 L 325.500000 296.500000" fill="none" stroke="#FFFFFF" stroke-width="3.500000" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="358.000000" y="290.000000" width="96.000000" height="28.000000" rx="14.000000" fill="#ECFDF5" stroke="#10B981" stroke-width="1.500000"/>
  </g>
  <g id="Empty_Unused_Group_1">
    <g id="Nested_Empty_Group_2"></g>
  </g>
</svg>`
    return loadSourceFromSvgString(verboseSvg, 'craft-editorial-card.svg', 'sample')
  }

  const canvas = document.createElement('canvas')
  if (kind === 'png') {
    canvas.width = 960
    canvas.height = 640
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 960, 640)

    // Floating translucent card with alpha shadow on transparent background
    ctx.save()
    ctx.fillStyle = '#18181B'
    ctx.beginPath()
    ctx.roundRect(140, 80, 680, 480, 42)
    ctx.fill()

    const grad = ctx.createLinearGradient(140, 80, 820, 560)
    grad.addColorStop(0, '#10B981')
    grad.addColorStop(0.5, '#0EA5E9')
    grad.addColorStop(1, '#6366F1')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(650, 240, 125, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#F97316'
    ctx.beginPath()
    ctx.arc(320, 370, 95, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
    ctx.beginPath()
    ctx.roundRect(220, 150, 520, 340, 28)
    ctx.fill()

    ctx.fillStyle = '#18181B'
    ctx.font = 'bold 38px sans-serif'
    ctx.fillText('Happier Image PNG', 270, 245)
    ctx.fillStyle = '#57534E'
    ctx.font = '22px sans-serif'
    ctx.fillText('Alpha Transparency · Lossless OxiPNG', 270, 295)

    // Color swatches
    const swatches = ['#18181B', '#10B981', '#0EA5E9', '#F97316', '#8B5CF6']
    swatches.forEach((color, idx) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(270 + idx * 72, 355, 54, 54, 14)
      ctx.fill()
    })
    ctx.restore()

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    )
    const file = new File([blob], 'happier-transparent-badge.png', {
      type: 'image/png',
    })
    return loadSourceFromFile(file, 'sample')
  }

  // Rich photographic-style landscape JPG
  canvas.width = 1200
  canvas.height = 800
  const ctx = canvas.getContext('2d')!
  const sky = ctx.createLinearGradient(0, 0, 0, 800)
  sky.addColorStop(0, '#1E1B4B')
  sky.addColorStop(0.45, '#7C2D12')
  sky.addColorStop(0.75, '#F97316')
  sky.addColorStop(1, '#FDE68A')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1200, 800)

  // Warm sun
  const sun = ctx.createRadialGradient(820, 290, 20, 820, 290, 220)
  sun.addColorStop(0, '#FFFBEB')
  sun.addColorStop(0.4, '#FDE047')
  sun.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.fillStyle = sun
  ctx.beginPath()
  ctx.arc(820, 290, 220, 0, Math.PI * 2)
  ctx.fill()

  // Layered mountain ridges
  const layers = [
    { yBase: 470, amp: 85, freq: 0.004, color: '#431407' },
    { yBase: 560, amp: 65, freq: 0.006, color: '#292524' },
    { yBase: 650, amp: 45, freq: 0.008, color: '#1C1917' },
  ]
  for (const layer of layers) {
    ctx.fillStyle = layer.color
    ctx.beginPath()
    ctx.moveTo(0, 800)
    for (let x = 0; x <= 1200; x += 10) {
      const y =
        layer.yBase +
        Math.sin(x * layer.freq) * layer.amp +
        Math.cos(x * layer.freq * 2.3) * (layer.amp * 0.4)
      ctx.lineTo(x, y)
    }
    ctx.lineTo(1200, 800)
    ctx.closePath()
    ctx.fill()
  }

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.98),
  )
  const file = new File([blob], 'craft-sunset-landscape.jpg', {
    type: 'image/jpeg',
  })
  return loadSourceFromFile(file, 'sample')
}
