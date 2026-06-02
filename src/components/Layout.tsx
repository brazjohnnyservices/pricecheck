import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            PriceCheck
          </Link>
          <span className="text-xs text-white/60 hidden sm:block">
            Pesquisa de preço de campo, sem planilha.
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm transition-colors ${
              pathname === '/' ? 'text-white font-medium' : 'text-white/70 hover:text-white'
            }`}
          >
            Início
          </Link>
          <Link
            to="/historico"
            className={`text-sm transition-colors ${
              pathname === '/historico' ? 'text-white font-medium' : 'text-white/70 hover:text-white'
            }`}
          >
            Histórico
          </Link>
          <Link
            to="/admin"
            className={`text-sm transition-colors ${
              pathname === '/admin' ? 'text-white font-medium' : 'text-white/70 hover:text-white'
            }`}
          >
            Admin
          </Link>
          <button
            onClick={() => signOut()}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="p-6">{children}</main>
    </div>
  )
}
