import { isNativeApp, sharePngFile } from './nativeStorage'

export type ExportResult = 'downloaded' | 'shared'

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function loadSvgImage(svgUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法渲染图片'))
    image.src = svgUrl
  })
}

export async function svgToPngBlob(
  svg: SVGSVGElement,
  width: number,
  height: number,
): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`)

  const serialized = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await loadSvgImage(svgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器不支持图片导出')
    context.fillStyle = '#f5f0e5'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片生成失败'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

export async function exportTodayCard(
  svg: SVGSVGElement,
  dateISO: string,
): Promise<ExportResult> {
  const blob = await svgToPngBlob(svg, 1080, 1920)
  const filename = `knot-today-${dateISO}.png`
  if (isNativeApp()) {
    await sharePngFile(blob, filename)
    return 'shared'
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}
