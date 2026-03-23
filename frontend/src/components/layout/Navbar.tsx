import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../../lib/store'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-500/40 transition-all">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">
              Video<span className="gradient-text">Machine</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-white/70 hover:text-white transition-colors text-sm">Fonctionnalités</Link>
            <Link to="/pricing" className="text-white/70 hover:text-white transition-colors text-sm">Tarifs</Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="btn-outline py-2 px-4 text-sm flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <button onClick={handleLogout} className="text-white/50 hover:text-white/80 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-white/70 hover:text-white transition-colors text-sm">Connexion</Link>
                <Link to="/register" className="btn-primary py-2 px-5 text-sm">Commencer gratuitement</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-4 space-y-3"
          >
            <Link to="/#features" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white py-2">Fonctionnalités</Link>
            <Link to="/pricing" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white py-2">Tarifs</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white py-2">Dashboard</Link>
                <button onClick={handleLogout} className="block text-accent-500 py-2">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white py-2">Connexion</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary inline-block">Commencer gratuitement</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
