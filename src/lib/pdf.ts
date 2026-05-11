import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './utils'

export interface PdfItem {
  codigo: number
  descricao: string
  categoria: string | null
  venda: number | null
  concorrentes: Array<{ nome: string | null; preco: number | null }>
}

function fPreco(p: number | null): string {
  return p != null && p > 0 ? formatCurrency(p) : '—'
}

function fDiff(venda: number | null, preco: number | null): string {
  if (!venda || !preco) return '—'
  const diff = ((venda - preco) / preco) * 100
  return (diff > 0 ? '+' : '') + diff.toFixed(1) + '%'
}

export function gerarPDF(clientNome: string, dataPesquisa: string, items: PdfItem[]): void {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })

  // Número máximo de concorrentes entre todos os itens
  const maxConcs = Math.max(1, ...items.map((it) => it.concorrentes.length))

  // Índices de colunas
  const COL_PRODUTO = 0
  const COL_VENDA = 1
  const COL_CONC_START = 2
  const COL_VS_MENOR = 2 + maxConcs
  const COL_VS_MEDIA = 3 + maxConcs

  // Pré-computar qual célula é a mais barata por linha
  const cheapestSet = new Set<string>() // "rowIdx_colIdx"
  items.forEach((item, rowIdx) => {
    const entries: { col: number; price: number }[] = []
    if (item.venda && item.venda > 0) entries.push({ col: COL_VENDA, price: item.venda })
    item.concorrentes.forEach((c, i) => {
      if (c.preco && c.preco > 0) entries.push({ col: COL_CONC_START + i, price: c.preco })
    })
    if (entries.length > 0) {
      const minPrice = Math.min(...entries.map((e) => e.price))
      entries
        .filter((e) => Math.abs(e.price - minPrice) < 0.001)
        .forEach((e) => cheapestSet.add(`${rowIdx}_${e.col}`))
    }
  })

  // Cabeçalho do documento
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(30, 42, 56)
  doc.text('PriceCheck — Pesquisa de Preço', 14, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`${clientNome}  ·  ${formatDate(dataPesquisa)}`, 14, 23)

  // Cabeçalhos das colunas
  const concHeaders = Array.from({ length: maxConcs }, (_, i) => `Conc. ${i + 1}`)
  const head = [['Produto', 'Venda Sug.', ...concHeaders, 'vs Menor', 'vs Média']]

  // Linhas
  const rows = items.map((item) => {
    const concsArr = Array.from({ length: maxConcs }, (_, i) => {
      const c = item.concorrentes[i]
      if (!c) return '—'
      if (c.nome && c.preco) return `${c.nome}\n${fPreco(c.preco)}`
      return c.nome || fPreco(c.preco)
    })

    const precos = item.concorrentes
      .map((c) => c.preco)
      .filter((p): p is number => p !== null && p > 0)
    const menor = precos.length ? Math.min(...precos) : null
    const media = precos.length ? precos.reduce((a, b) => a + b, 0) / precos.length : null

    return [
      `#${item.codigo}\n${item.descricao}`,
      fPreco(item.venda),
      ...concsArr,
      fDiff(item.venda, menor),
      fDiff(item.venda, media),
    ]
  })

  // Larguras dinâmicas — A4 landscape usável ≈ 269mm
  const concWidth = Math.min(55, Math.max(28, Math.floor((269 - 65 - 26 - 20 - 20) / maxConcs)))
  const columnStyles: Record<number, object> = {
    [COL_PRODUTO]: { cellWidth: 65 },
    [COL_VENDA]: { cellWidth: 26, halign: 'right' },
    [COL_VS_MENOR]: { cellWidth: 20, halign: 'center' },
    [COL_VS_MEDIA]: { cellWidth: 20, halign: 'center' },
  }
  for (let i = 0; i < maxConcs; i++) {
    columnStyles[COL_CONC_START + i] = { cellWidth: concWidth }
  }

  autoTable(doc, {
    startY: 30,
    head,
    body: rows,
    headStyles: {
      fillColor: [30, 42, 56],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 42, 56],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles,
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const col = data.column.index

      // Venda sugerida em azul/negrito
      if (col === COL_VENDA) {
        data.cell.styles.textColor = [29, 78, 216]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.halign = 'right'
      }

      // vs Menor / vs Média: cor por direção
      if (col === COL_VS_MENOR || col === COL_VS_MEDIA) {
        const val = data.cell.text[0]
        if (val.startsWith('+')) data.cell.styles.textColor = [239, 68, 68]
        else if (val.startsWith('-')) data.cell.styles.textColor = [34, 197, 94]
      }

      // Célula mais barata: fundo verde claro
      const key = `${data.row.index}_${col}`
      if (cheapestSet.has(key)) {
        data.cell.styles.fillColor = [220, 252, 231]
        data.cell.styles.textColor = [22, 101, 52]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // Footer com número de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(170, 170, 170)
    doc.text(
      `PriceCheck · Gerado em ${formatDate(new Date())} · Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    )
  }

  doc.save(`PriceCheck_${clientNome.replace(/\s+/g, '_')}_${dataPesquisa}.pdf`)
}
