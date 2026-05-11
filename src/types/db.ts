export type Categoria =
  | 'Azeitonas'
  | 'Champignon'
  | 'Macarrão Inst.'
  | 'Amendoim'
  | 'Canjica'
  | 'Pipoca'
  | 'Tapioca'
  | 'Coco Ralado'
  | 'Catchup'
  | 'Mostarda'
  | 'Farofa'
  | 'Farinha de Milho'
  | 'Trigo Kibe'
  | 'Uva Passa'
  | 'Tempero Fácil'

export interface Client {
  id: number
  codigo: number
  razao_social: string
  nome_fantasia: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  telefone: string | null
  created_at: string
}

export interface Product {
  id: number
  codigo: number
  descricao: string
  categoria: Categoria | null
  custo_padrao: number | null
  pct_investimento: number
  is_principal: boolean
  created_at: string
}

export interface Research {
  id: number
  client_id: number
  data_pesquisa: string          // ISO date string
  observacoes: string | null
  created_at: string
  // join opcional
  client?: Client
}

export interface ResearchItem {
  id: number
  research_id: number
  product_id: number
  custo: number | null
  venda_sugerida: number | null
  conc1_nome: string | null
  conc1_preco: number | null
  conc2_nome: string | null
  conc2_preco: number | null
  conc3_nome: string | null
  conc3_preco: number | null
  created_at: string
  // joins opcionais
  product?: Product
}

// Tipos utilitários para inserção (sem id e created_at)
export type NewClient = Omit<Client, 'id' | 'created_at'>
export type NewProduct = Omit<Product, 'id' | 'created_at'>
export type NewResearch = Omit<Research, 'id' | 'created_at' | 'client'>
export type NewResearchItem = Omit<ResearchItem, 'id' | 'created_at' | 'product'>
