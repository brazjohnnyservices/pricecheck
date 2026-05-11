interface Props {
  label: string
  nome: string
  preco: string
  onNome: (v: string) => void
  onPreco: (v: string) => void
  onRemove?: () => void
}

export default function ConcorrenteBox({ label, nome, preco, onNome, onPreco, onRemove }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-300 hover:text-danger transition-colors text-base leading-none"
            aria-label="Remover concorrente"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => onNome(e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="number"
          placeholder="0,00"
          step="0.01"
          min="0"
          value={preco}
          onChange={(e) => onPreco(e.target.value)}
          className="w-20 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
  )
}
