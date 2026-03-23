import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Twitter, Link2, Settings, CreditCard, User, LogOut, Menu, X, Home, Zap, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../lib/store'

const nav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', end: true },
  { to: '/dashboard/youtube', icon: Video, label: 'YouTube Shorts' },
  { to: '/dashboard/twitter', icon: Twitter, label: 'Twitter Bot' },
  { to: '/dashboard/affiliate', icon: Link2, label: 'Affiliate Marketing' },
  { to: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
  { to: '/dashboard/pricing', icon: CreditCard, label: 'Abonnements' },
  { to: '/dashboard/profile', icon: User, label: 'Profil' },
]

const planColor: Record<string, string> = {
  free: 'text-gray-400', starter: 'text-blue-400', pro: 'text-purple-400', enterprise: 'text-yellow-400'
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">Video<span className="gradient-text">Machine</span></span>
        </div>
        <div className="text-xs text-white/30 mt-1 ml-10">Powered by MoneyPrinterV2</div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className={`text-xs font-medium capitalize ${planColor[user?.plan || 'free']}`}>Plan {user?.plan}</p>
          </div>
        </div>
        {user?.videos_limit !== -1 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/30 mb-1">
              <span>Vidéos</span><span>{user?.videos_generated}/{user?.videos_limit}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full">
              <div className="h-full bg-gradient-to-r from-primary-500 to-purple-600 rounded-full"
                style={{ width: `${Math.min(((user?.videos_generated || 0) / (user?.videos_limit || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20'
                         : 'text-white/50 hover:text-white hover:bg-white/5'
              }`
            }>
            <item.icon className="w-4 h-4" />{item.label}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade banner */}
      {user?.plan === 'free' && (
        <div className="p-3">
          <div className="glass p-4 bg-gradient-to-br from-primary-500/10 to-purple-600/10 border-primary-500/20">
            <Zap className="w-4 h-4 text-yellow-400 mb-2" />
            <p className="text-white text-sm font-semibold">Passer Pro</p>
            <p className="text-white/40 text-xs mb-3">100 vidéos/mois illimité</p>
            <NavLink to="/dashboard/pricing" className="btn-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1">
              Upgrader <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm">
          <LogOut className="w-4 h-4" />Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#080817] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-black/30 border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70 z-40 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0d0d2b] border-r border-white/10 z-50 lg:hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="text-white font-bold text-sm">VideoMachine</span>
                <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center px-4 py-3 border-b border-white/5 bg-black/20">
          <button onClick={() => setOpen(true)} className="text-white/70 mr-3"><Menu className="w-5 h-5" /></button>
          <span className="text-white font-semibold text-sm">VideoMachine</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
