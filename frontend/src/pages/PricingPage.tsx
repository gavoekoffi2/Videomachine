import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Check, Loader2, Zap, Crown, Building2 } from 'lucide-react'
import { paymentsApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import toast from 'react-hot-toast'

const planIcon = { free: Zap, starter: Zap, pro: Crown, enterprise: Building2 }
const planGrad = { free:'from-gray-500 to-slate-600', starter:'from-blue-500 to-cyan-500', pro:'from-primary-500 to-purple-600', enterprise:'from-yellow-500 to-orange-500' }

export default function PricingPage({ isDashboard=false }: { isDashboard?: boolean }) {
  const [loading, setLoading] = useState<string|null>(null)
  const { user, isAuth, updateUser } = useAuthStore()
  const navigate = useNavigate()

  const { data } = useQuery({ queryKey:['plans'], queryFn: () => paymentsApi.plans() })
  const plans = data?.data?.plans || []

  const subscribe = async (planId: string) => {
    if (!isAuth) { navigate('/register'); return }
    if (planId === 'free' || planId === user?.plan) { toast('Vous êtes déjà sur ce plan'); return }
    setLoading(planId)
    try {
      const r = await paymentsApi.initiate(planId, 'XOF')
      const { payment_url, transaction_id, mock } = r.data
      if (mock) {
        toast.loading('Simulation du paiement...')
        await new Promise(r => setTimeout(r, 1500))
        await paymentsApi.demoComplete(transaction_id)
        toast.dismiss(); toast.success(`Plan ${planId} activé! (Mode démo)`)
        updateUser({ plan: planId, videos_limit: planId === 'enterprise' ? -1 : planId === 'pro' ? 100 : 20 })
        if (isDashboard) navigate('/dashboard')
        else navigate('/dashboard/youtube')
      } else {
        window.location.href = payment_url
      }
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur paiement') }
    finally { setLoading(null) }
  }

  const content = (
    <div className="max-w-5xl mx-auto">
      {isDashboard ? (
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Abonnements</h1>
          <p className="text-white/40 text-sm mt-1">Plan actuel: <span className="text-primary-400 capitalize font-semibold">{user?.plan}</span></p>
        </div>
      ) : (
        <div className="text-center mb-14 pt-28">
          <h1 className="text-5xl font-black text-white mb-4">Tarifs <span className="gradient-text">simples</span></h1>
          <p className="text-white/50 text-lg">Mobile Money, Orange Money, Wave — via FedaPay</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p: any, i: number) => {
          const Icon = planIcon[p.id as keyof typeof planIcon] || Zap
          const grad = planGrad[p.id as keyof typeof planGrad] || planGrad.free
          const isCurrent = user?.plan === p.id

          return (
            <motion.div key={p.id} initial={{ opacity:0, y:25 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }}
              className={`glass p-6 flex flex-col relative ${p.popular ? 'border-primary-500/50' : ''}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">POPULAIRE</div>}
              {isCurrent && <div className="absolute -top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">ACTUEL</div>}

              <div className={`w-9 h-9 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{p.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-black text-white">{p.price_xof === 0 ? 'Gratuit' : `${p.price_xof.toLocaleString()}`}</span>
                {p.price_xof > 0 && <span className="text-white/30 text-xs"> FCFA/mois</span>}
              </div>
              <p className="text-primary-400 text-sm font-medium mb-4">
                {p.videos === -1 ? '∞ vidéos/mois' : `${p.videos} vidéos/mois`}
              </p>
              <ul className="space-y-2 flex-1 mb-5">
                {p.features?.map((f: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-white/50 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => subscribe(p.id)} disabled={isCurrent || loading === p.id}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isCurrent ? 'bg-green-500/15 text-green-400 cursor-default border border-green-500/20' : p.popular ? 'btn-primary' : 'btn-ghost'}`}>
                {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? 'Plan actuel' : p.price_xof === 0 ? 'Commencer' : 'Choisir'}
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-10 text-center">
        <p className="text-white/30 text-sm mb-4">Méthodes de paiement acceptées</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['📱 MTN MoMo', '📱 Orange Money', '📱 Wave', '📱 Moov Money', '💳 Visa/MasterCard'].map(m => (
            <span key={m} className="glass px-3 py-1.5 text-white/40 text-sm">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )

  if (isDashboard) return content
  return (
    <div className="min-h-screen bg-[#080817]">
      <Navbar />
      <div className="px-4 pb-20">{content}</div>
    </div>
  )
}
