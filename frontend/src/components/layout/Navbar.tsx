import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Menu, X, LogOut } from 'lucide-react'
import { useAuthStore } from '../../lib/store'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuth, user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">Video<span className="gradient-text">Machine</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/#features" className="text-white/60 hover:text-white text-sm transition-colors">Fonctionnalités</Link>
          <Link to="/pricing" className="text-white/60 hover:text-white text-sm transition-colors">Tarifs</Link>
          {isAuth ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="btn-primary text-sm py-2">Dashboard</Link>
              <button onClick={() => { logout(); navigate('/') }} className="text-white/40 hover:text-white/70">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-white/60 hover:text-white text-sm">Connexion</Link>
              <Link to="/register" className="btn-primary text-sm py-2">Commencer gratuitement</Link>
            </div>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-1">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-black/95 border-b border-white/10 px-4 py-4 space-y-2">
            <Link to="/#features" onClick={() => setOpen(false)} className="block text-white/60 hover:text-white py-2 text-sm">Fonctionnalités</Link>
            <Link to="/pricing" onClick={() => setOpen(false)} className="block text-white/60 hover:text-white py-2 text-sm">Tarifs</Link>
            {isAuth ? (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block btn-primary text-center text-sm mt-2">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block text-white/60 hover:text-white py-2 text-sm">Connexion</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="block btn-primary text-center text-sm mt-2">Commencer gratuitement</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
