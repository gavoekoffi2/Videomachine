import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { User, Lock, CreditCard, RefreshCw } from 'lucide-react'
import { authApi, paymentsApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [pwd, setPwd] = useState({ cur:'', new:'', confirm:'' })
  const [savingPwd, setSavingPwd] = useState(false)

  const { data } = useQuery({ queryKey:['payments-history'], queryFn: () => paymentsApi.history() })
  const history = data?.data || []

  const saveProfile = async () => {
    setSaving(true)
    try { await authApi.updateMe(fullName); updateUser({ full_name: fullName }); toast.success('Profil mis à jour') }
    catch { toast.error('Erreur') } finally { setSaving(false) }
  }

  const changePwd = async () => {
    if (pwd.new !== pwd.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (pwd.new.length < 8) { toast.error('Minimum 8 caractères'); return }
    setSavingPwd(true)
    try { await authApi.changePwd(pwd.cur, pwd.new); toast.success('Mot de passe modifié'); setPwd({ cur:'', new:'', confirm:'' }) }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur') } finally { setSavingPwd(false) }
  }

  const planColor: Record<string, string> = { free:'bg-gray-500/20 text-gray-400', starter:'bg-blue-500/20 text-blue-400', pro:'bg-purple-500/20 text-purple-400', enterprise:'bg-yellow-500/20 text-yellow-400' }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-black text-white mb-6">Mon Profil</h1>

        {/* User card */}
        <div className="glass p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{user?.username}</h2>
              <p className="text-white/40 text-sm">{user?.email}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block capitalize ${planColor[user?.plan || 'free']}`}>
                Plan {user?.plan}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/5">
            {[
              { v: user?.videos_generated ?? 0, l: 'Vidéos créées' },
              { v: user?.videos_limit === -1 ? '∞' : user?.videos_limit, l: 'Limite/mois' },
              { v: user?.plan, l: 'Plan actuel' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-black text-white capitalize">{s.v}</p>
                <p className="text-white/30 text-xs">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit profile */}
        <div className="glass p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary-400" /> Informations</h3>
          <div className="space-y-3">
            <div><label className="label">Nom complet</label><input value={fullName} onChange={e => setFullName(e.target.value)} className="input" /></div>
            <div><label className="label">Email</label><input value={user?.email || ''} disabled className="input opacity-40" /></div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="glass p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-orange-400" /> Mot de passe</h3>
          <div className="space-y-3">
            <div><label className="label">Mot de passe actuel</label><input type="password" value={pwd.cur} onChange={e => setPwd(p => ({...p, cur:e.target.value}))} className="input" /></div>
            <div><label className="label">Nouveau mot de passe</label><input type="password" value={pwd.new} onChange={e => setPwd(p => ({...p, new:e.target.value}))} className="input" /></div>
            <div><label className="label">Confirmer</label><input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({...p, confirm:e.target.value}))} className="input" /></div>
            <button onClick={changePwd} disabled={savingPwd || !pwd.cur || !pwd.new} className="btn-ghost">
              {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </div>

        {/* Payment history */}
        {history.length > 0 && (
          <div className="glass p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-green-400" /> Historique paiements</h3>
            <div className="space-y-2.5">
              {history.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm capitalize">Plan {p.plan}</p>
                    <p className="text-white/30 text-xs">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{p.amount?.toLocaleString()} {p.currency}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                      {p.status === 'completed' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
