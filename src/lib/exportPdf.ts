/**
 * 績效分析 PDF 匯出。
 * 用 jsPDF + html2canvas 將指定 DOM 元素截圖組成多頁 A4 直式 PDF。
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

interface ExportSection {
  /** DOM 元素 id */
  elementId: string
  /** 顯示標題（不存在時用 elementId） */
  title?: string
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MARGIN_MM = 10
const USABLE_WIDTH = A4_WIDTH_MM - MARGIN_MM * 2
const USABLE_HEIGHT = A4_HEIGHT_MM - MARGIN_MM * 2

/**
 * 把指定 DOM 元素截圖，組合成多頁 A4 PDF 下載。
 */
export async function exportPerformancePdf(
  sections: ExportSection[],
  filename: string,
): Promise<void> {
  const pdf = new jsPDF({ format: 'a4', orientation: 'p', unit: 'mm' })
  let isFirst = true

  for (const section of sections) {
    const el = document.getElementById(section.elementId)
    if (!el) continue

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const imgWidthMm = USABLE_WIDTH
    const imgHeightMm = (canvas.height / canvas.width) * imgWidthMm

    if (!isFirst) pdf.addPage()
    isFirst = false

    // 若高度超過一頁，分頁顯示
    if (imgHeightMm <= USABLE_HEIGHT) {
      pdf.addImage(imgData, 'PNG', MARGIN_MM, MARGIN_MM, imgWidthMm, imgHeightMm)
    } else {
      // 切多頁
      let yOffset = 0
      let pageIdx = 0
      const pageHeightInImagePx = (USABLE_HEIGHT / imgWidthMm) * canvas.width
      while (yOffset < canvas.height) {
        if (pageIdx > 0) pdf.addPage()
        const sliceHeight = Math.min(pageHeightInImagePx, canvas.height - yOffset)

        // 創建臨時 canvas 切片
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = sliceHeight
        const ctx = slice.getContext('2d')!
        ctx.drawImage(
          canvas,
          0, yOffset, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight,
        )
        const sliceData = slice.toDataURL('image/png')
        pdf.addImage(
          sliceData, 'PNG',
          MARGIN_MM, MARGIN_MM,
          imgWidthMm, (sliceHeight / canvas.width) * imgWidthMm,
        )
        yOffset += sliceHeight
        pageIdx++
      }
    }
  }

  pdf.save(filename)
}
