import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { User, Mail, Lock, CreditCard, Calendar, Shield } from 'lucide-react'
import { authApi, paymentsApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' })
  const [savingPwd, setSavingPwd] = useState(false)

  const { data: historyData } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentsApi.history(),
  })
  const history = historyData?.data || []

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      await authApi.updateMe({ full_name: fullName })
      updateUser({ full_name: fullName })
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (pwd.new !== pwd.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (pwd.new.length < 8) { toast.error('Le mot de passe doit faire au moins 8 caractères'); return }
    setSavingPwd(true)
    try {
      await authApi.changePassword(pwd.current, pwd.new)
      toast.success('Mot de passe modifié')
      setPwd({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSavingPwd(false)
    }
  }

  const planBadgeColors = {
    free: 'bg-gray-500/20 text-gray-400',
    starter: 'bg-blue-500/20 text-blue-400',
    pro: 'bg-purple-500/20 text-purple-400',
    enterprise: 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-black text-white">Mon Profil</h1>
      </motion.div>

      {/* Profile Info */}
      <div className="space-y-4">
        {/* Avatar & Plan */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{user?.username}</h2>
              <p className="text-white/50 text-sm">{user?.email}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block capitalize ${planBadgeColors[user?.plan as keyof typeof planBadgeColors] || 'bg-gray-500/20 text-gray-400'}`}>
                Plan {user?.plan}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{user?.videos_generated}</p>
              <p className="text-white/40 text-xs">Vidéos créées</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{user?.videos_limit === -1 ? '∞' : user?.videos_limit}</p>
              <p className="text-white/40 text-xs">Limite</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '--'}
              </p>
              <p className="text-white/40 text-xs">Membre depuis</p>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-400" /> Informations personnelles
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-white/50 text-xs mb-1.5 block">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1.5 block">Email</label>
              <input type="email" value={user?.email || ''} disabled className="input-field opacity-50" />
            </div>
            <button onClick={saveProfile} disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" /> Changer le mot de passe
          </h3>
          <div className="space-y-3">
            <input type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
              placeholder="Mot de passe actuel" className="input-field" />
            <input type="password" value={pwd.new} onChange={e => setPwd(p => ({ ...p, new: e.target.value }))}
              placeholder="Nouveau mot de passe (min. 8 caractères)" className="input-field" />
            <input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Confirmer le nouveau mot de passe" className="input-field" />
            <button onClick={changePassword} disabled={savingPwd || !pwd.current || !pwd.new} className="btn-outline">
              {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </div>

        {/* Payment History */}
        {history.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-400" /> Historique des paiements
            </h3>
            <div className="space-y-3">
              {history.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm capitalize">Plan {p.plan}</p>
                    <p className="text-white/40 text-xs">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{p.amount.toLocaleString()} {p.currency}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {p.status === 'completed' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
