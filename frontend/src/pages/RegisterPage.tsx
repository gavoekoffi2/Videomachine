import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { authApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuth(res.data.user, res.data.access_token)
      toast.success('Compte créé! Bienvenue sur VideoMachine 🎉')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    '3 vidéos gratuites pour commencer',
    'Pas de carte bancaire requise',
    'Accès immédiat au dashboard',
  ]

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 animated-gradient">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Video<span className="gradient-text">Machine</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Créer un compte</h1>
          <p className="text-white/50">Commencez gratuitement — sans carte bancaire</p>
        </div>

        {/* Perks */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {perks.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
              <Check className="w-3.5 h-3.5 text-green-400" />{p}
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={form.full_name} onChange={set('full_name')}
                  placeholder="Jean Dupont" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={form.username} onChange={set('username')}
                  required placeholder="jeandupont" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" value={form.email} onChange={set('email')}
                  required placeholder="votre@email.com" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  required minLength={8} placeholder="Minimum 8 caractères" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Créer mon compte <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-white/30 text-xs text-center mt-4">
            En créant un compte, vous acceptez nos conditions d'utilisation.
          </p>

          <div className="mt-4 text-center">
            <p className="text-white/50 text-sm">
              Déjà un compte?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Se connecter</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
