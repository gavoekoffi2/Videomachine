import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [pwd, setPwd] = useState(''); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore(); const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const r = await authApi.login(email, pwd)
      setAuth(r.data.user, r.data.access_token)
      toast.success('Connexion réussie!'); navigate('/dashboard')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Identifiants incorrects') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#080817] flex items-center justify-center p-4 animated-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Video<span className="gradient-text">Machine</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Bon retour!</h1>
          <p className="text-white/40 text-sm">Connectez-vous à votre compte</p>
        </div>
        <div className="glass p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} required placeholder="••••••••" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Se connecter'}
            </button>
          </form>
          <p className="text-white/40 text-sm text-center mt-5">
            Pas de compte? <Link to="/register" className="text-primary-400 hover:text-primary-300">Créer un compte</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
