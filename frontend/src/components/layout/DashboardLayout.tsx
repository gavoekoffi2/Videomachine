import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Video, Plus, CreditCard, User,
  LogOut, Menu, X, Zap, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../lib/store'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/generate', icon: Plus, label: 'Générer' },
  { to: '/dashboard/videos', icon: Video, label: 'Mes Vidéos' },
  { to: '/dashboard/pricing', icon: CreditCard, label: 'Abonnements' },
  { to: '/dashboard/profile', icon: User, label: 'Profil' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  const planColors = {
    free: 'text-gray-400',
    starter: 'text-blue-400',
    pro: 'text-purple-400',
    enterprise: 'text-yellow-400',
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">Video<span className="gradient-text">Machine</span></span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className={`text-xs font-medium capitalize ${planColors[user?.plan as keyof typeof planColors] || 'text-gray-400'}`}>
              Plan {user?.plan}
            </p>
          </div>
        </div>
        {user?.videos_limit !== -1 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>Vidéos</span>
              <span>{user?.videos_generated}/{user?.videos_limit}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-600 rounded-full transition-all"
                style={{ width: `${Math.min(((user?.videos_generated || 0) / (user?.videos_limit || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade Banner */}
      {user?.plan === 'free' && (
        <div className="p-4">
          <div className="glass-card p-4 bg-gradient-to-br from-primary-500/10 to-purple-600/10 border-primary-500/20">
            <Zap className="w-5 h-5 text-yellow-400 mb-2" />
            <p className="text-white text-sm font-semibold mb-1">Passez Pro</p>
            <p className="text-white/50 text-xs mb-3">100 vidéos/mois, voix IA premium</p>
            <NavLink to="/dashboard/pricing" className="btn-primary text-xs py-2 px-3 flex items-center gap-1 w-full justify-center">
              Upgrader <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#0a0a1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-black/30 border-r border-white/5 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#0d0d2b] border-r border-white/10 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="text-white font-bold">Menu</span>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="text-white/60 w-5 h-5" />
                </button>
              </div>
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar (Mobile) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
          <button onClick={() => setSidebarOpen(true)} className="text-white/70 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">VideoMachine</span>
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
