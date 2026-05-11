import * as XLSX from 'xlsx'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Categoria, NewClient, NewProduct, Product } from '@/types/db'

// ── Tipos de aba ──────────────────────────────────────────────────────────────
type Tab = 'clientes' | 'produtos' | 'configurar'

const CATEGORIAS: Categoria[] = [
  'Azeitonas', 'Champignon', 'Macarrão Inst.', 'Amendoim', 'Canjica',
  'Pipoca', 'Tapioca', 'Coco Ralado', 'Catchup', 'Mostarda',
  'Farofa', 'Farinha de Milho', 'Trigo Kibe', 'Uva Passa', 'Tempero Fácil',
]

// ── Aba de configuração de produtos ──────────────────────────────────────────
function ProdutosConfigTab() {
  const [produtos, setProdutos] = useState<Product[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('descricao')
      .then(({ data }) => {
        if (data) setProdutos(data)
        setLoading(false)
      })
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function updateProduto(id: number, patch: Partial<Pick<Product, 'categoria' | 'is_principal'>>) {
    setSaving(id)
    const { error } = await supabase.from('products').update(patch as object).eq('id', id)
    if (!error) {
      setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      showToast('Salvo!')
    }
    setSaving(null)
  }

  const filtrados = produtos.filter((p) =>
    p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    String(p.codigo).includes(busca)
  )

  if (loading) return <p className="text-sm text-gray-500">Carregando produtos…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por descrição ou código…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="text-xs text-gray-400">{filtrados.length} produto(s)</span>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-success text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-primary text-white sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-20">Código</th>
              <th className="px-3 py-2 text-left font-medium">Descrição</th>
              <th className="px-3 py-2 text-left font-medium w-40">Custo</th>
              <th className="px-3 py-2 text-left font-medium w-48">Categoria</th>
              <th className="px-3 py-2 text-center font-medium w-24">Principal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 font-mono text-gray-500">{p.codigo}</td>
                <td className="px-3 py-1.5">{p.descricao}</td>
                <td className="px-3 py-1.5 text-gray-500">
                  {p.custo_padrao != null ? `R$ ${p.custo_padrao.toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={p.categoria ?? ''}
                    disabled={saving === p.id}
                    onChange={(e) =>
                      updateProduto(p.id, {
                        categoria: (e.target.value as Categoria) || null,
                      })
                    }
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  >
                    <option value="">— sem categoria —</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={p.is_principal}
                    disabled={saving === p.id}
                    onChange={(e) => updateProduto(p.id, { is_principal: e.target.checked })}
                    className="w-4 h-4 accent-accent cursor-pointer disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const str = (v: unknown): string | null =>
  v != null && String(v).trim() !== '' ? String(v).trim() : null

function parseClientes(rows: Record<string, unknown>[]): NewClient[] {
  return rows.map((r) => ({
    codigo: Number(r['Cód. Cliente']),
    razao_social: str(r['Razão Social']) ?? '',
    nome_fantasia: str(r['Nome Fantasia']),
    endereco: str(r['Endereço']),
    numero: str(r['Número']),
    bairro: str(r['Bairro']),
    cidade: str(r['Cidade']),
    uf: str(r['UF']),
    telefone: str(r['Telefone']),
  }))
}

function parseProdutos(rows: Record<string, unknown>[]): NewProduct[] {
  return rows
    .filter((r) => r['Cód'] != null && r['Descrição'] != null)
    .map((r) => ({
      codigo: Number(r['Cód']),
      descricao: String(r['Descrição']).trim(),
      custo_padrao: r['Prc Unitário'] != null ? Number(r['Prc Unitário']) : null,
      categoria: null,
      pct_investimento: 0,
      is_principal: false,
    }))
}

// ── Componente genérico de upload + preview + importar ────────────────────────
interface ImportCardProps<T> {
  label: string
  colunaInfo: string
  headers: string[]
  getRow: (r: T) => (string | number | null)[]
  parse: (rows: Record<string, unknown>[]) => T[]
  table: 'clients' | 'products'
  conflictCol: string
}

function ImportCard<T extends Record<string, unknown>>({
  label,
  colunaInfo,
  headers,
  getRow,
  parse,
  table,
  conflictCol,
}: ImportCardProps<T>) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ ok: number; err: number } | null>(null)
  const [fileName, setFileName] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
      setRows(parse(json))
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    if (rows.length === 0) return
    setLoading(true)
    setDone(null)
    let ok = 0
    let err = 0
    const BATCH = 100
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { error } = await supabase
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(batch as any, { onConflict: conflictCol })
      if (error) err += batch.length
      else ok += batch.length
    }
    setLoading(false)
    setDone({ ok, err })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{colunaInfo}</p>

      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent transition-colors bg-white">
        <span className="text-sm text-gray-500">
          {fileName ? `📄 ${fileName}` : 'Clique para selecionar o arquivo XLSX'}
        </span>
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      </label>

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">
              {rows.length} {label} encontrados — pré-visualização (primeiros 5):
            </span>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Importando…' : `Importar ${rows.length} ${label}`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-primary text-white">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {getRow(r).map((cell, j) => (
                      <td key={j} className="px-3 py-2 whitespace-nowrap">
                        {cell ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {done && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            done.err === 0
              ? 'bg-success/10 text-success border border-success/30'
              : 'bg-warning/10 text-warning border border-warning/30'
          }`}
        >
          {done.err === 0
            ? `✓ ${done.ok} ${label} importados com sucesso!`
            : `${done.ok} importados, ${done.err} com erro.`}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
const TAB_LABELS: Record<Tab, string> = {
  clientes: 'Importar Clientes',
  produtos: 'Importar Produtos',
  configurar: 'Categorias e Destaque',
}

export default function ImportPage() {
  const [tab, setTab] = useState<Tab>('configurar')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="font-serif text-2xl text-primary">Admin</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              tab === t ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'clientes' && (
        <ImportCard<NewClient>
          label="clientes"
          colunaInfo="Colunas esperadas: Cód. Cliente, Razão Social, Nome Fantasia, Endereço, Número, Bairro, Cidade, UF, Telefone."
          headers={['Código', 'Razão Social', 'Nome Fantasia', 'Cidade', 'UF', 'Bairro', 'Telefone']}
          getRow={(r) => [r.codigo, r.razao_social, r.nome_fantasia, r.cidade, r.uf, r.bairro, r.telefone]}
          parse={parseClientes}
          table="clients"
          conflictCol="codigo"
        />
      )}

      {tab === 'produtos' && (
        <ImportCard<NewProduct>
          label="produtos"
          colunaInfo="Colunas esperadas: Cód, Descrição, Prc Unitário."
          headers={['Código', 'Descrição', 'Custo (R$)']}
          getRow={(r) => [r.codigo, r.descricao, r.custo_padrao]}
          parse={parseProdutos}
          table="products"
          conflictCol="codigo"
        />
      )}

      {tab === 'configurar' && <ProdutosConfigTab />}
    </div>
  )
}
