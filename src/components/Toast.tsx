import { useEffect } from 'react'

interface Props {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade-in"
      style={{ backgroundColor: type === 'success' ? '#22C55E' : '#EF4444' }}
    >
      {message}
    </div>
  )
}
