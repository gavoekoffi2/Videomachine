import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react'
import { authApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [f, setF] = useState({ email:'', username:'', password:'', full_name:'' })
  const [show, setShow] = useState(false); const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore(); const navigate = useNavigate()
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (f.password.length < 8) { toast.error('Mot de passe trop court (min 8 car.)'); return }
    setLoading(true)
    try {
      const r = await authApi.register(f)
      setAuth(r.data.user, r.data.access_token)
      toast.success('Bienvenue sur VideoMachine! 🎉'); navigate('/dashboard')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur inscription') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#080817] flex items-center justify-center p-4 animated-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Video<span className="gradient-text">Machine</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Créer un compte</h1>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {['3 vidéos gratuites','Sans CB','Accès immédiat'].map(t => (
              <span key={t} className="flex items-center gap-1 text-xs text-white/40">
                <Check className="w-3 h-3 text-green-400" />{t}
              </span>
            ))}
          </div>
        </div>
        <div className="glass p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nom complet</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={f.full_name} onChange={set('full_name')} placeholder="Jean Dupont" className="input pl-10" /></div>
            </div>
            <div>
              <label className="label">Nom d'utilisateur *</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={f.username} onChange={set('username')} required placeholder="jeandupont" className="input pl-10" /></div>
            </div>
            <div>
              <label className="label">Email *</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" value={f.email} onChange={set('email')} required placeholder="votre@email.com" className="input pl-10" /></div>
            </div>
            <div>
              <label className="label">Mot de passe *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} required minLength={8} placeholder="Min. 8 caractères" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-1">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-white/40 text-sm text-center mt-4">
            Déjà un compte? <Link to="/login" className="text-primary-400 hover:text-primary-300">Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
