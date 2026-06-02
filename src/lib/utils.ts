import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('T')[0].split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
  }
  return date.toLocaleDateString('pt-BR')
}

export function calcVendaSugerida(custo: number): number {
  return parseFloat((custo * 1.4).toFixed(2))
}

export function calcDiffPercent(vendaSugerida: number, preco: number): number {
  if (preco === 0) return 0
  return parseFloat((((vendaSugerida - preco) / preco) * 100).toFixed(1))
}
