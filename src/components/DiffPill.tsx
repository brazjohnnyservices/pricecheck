interface Props {
  label: string
  venda: number
  concorrente: number | null
}

export default function DiffPill({ label, venda, concorrente }: Props) {
  if (!concorrente || concorrente === 0) return null

  const diff = ((venda - concorrente) / concorrente) * 100
  const win = diff <= 0

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
        win ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}
    >
      {diff > 0 ? '+' : ''}
      {diff.toFixed(1)}% {label}
    </span>
  )
}
