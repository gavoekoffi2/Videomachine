import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Check, Zap, Crown, Building2, Loader2, ArrowLeft } from 'lucide-react'
import { paymentsApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import toast from 'react-hot-toast'

const planIcons = { free: Zap, starter: Zap, pro: Crown, enterprise: Building2 }
const planGradients = {
  free: 'from-gray-500 to-slate-600',
  starter: 'from-blue-500 to-cyan-500',
  pro: 'from-primary-500 to-purple-600',
  enterprise: 'from-yellow-500 to-orange-500',
}

export default function PricingPage({ isDashboard = false }: { isDashboard?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentsApi.plans(),
  })
  const plans = plansData?.data?.plans || []

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) { navigate('/register'); return }
    if (planId === 'free') { toast('Vous êtes déjà sur le plan gratuit'); return }
    if (planId === user?.plan) { toast('Vous êtes déjà sur ce plan'); return }

    setLoading(planId)
    try {
      const res = await paymentsApi.initiate(planId, 'XOF')
      const { payment_url, transaction_id, mock } = res.data

      if (mock) {
        // Demo mode: auto-complete
        toast.loading('Simulation de paiement...')
        await new Promise(r => setTimeout(r, 2000))
        await paymentsApi.demoComplete(transaction_id)
        toast.dismiss()
        toast.success(`Plan ${planId} activé! (Mode démo)`)
        navigate('/dashboard')
      } else {
        // Redirect to FedaPay checkout
        window.location.href = payment_url
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors du paiement')
    } finally {
      setLoading(null)
    }
  }

  const content = (
    <div className="max-w-5xl mx-auto">
      {isDashboard && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black text-white">Abonnements</h1>
          <p className="text-white/50 mt-1">
            Plan actuel: <span className="text-primary-400 font-semibold capitalize">{user?.plan}</span>
          </p>
        </motion.div>
      )}

      {!isDashboard && (
        <div className="text-center mb-12 pt-24">
          <h1 className="text-5xl font-black text-white mb-4">
            Tarifs <span className="gradient-text">simples</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Mobile Money, Orange Money, Wave et carte bancaire acceptés.
            Paiement sécurisé via FedaPay.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan: any, i: number) => {
          const Icon = planIcons[plan.id as keyof typeof planIcons] || Zap
          const gradient = planGradients[plan.id as keyof typeof planGradients] || 'from-gray-500 to-slate-600'
          const isCurrent = user?.plan === plan.id
          const isPopular = plan.popular

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 relative flex flex-col ${isPopular ? 'border-primary-500/50' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  POPULAIRE
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ACTUEL
                </div>
              )}

              <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-white font-bold text-lg mb-2">{plan.name}</h3>

              <div className="mb-1">
                <span className="text-3xl font-black text-white">{plan.price_xof.toLocaleString()}</span>
                <span className="text-white/40 text-sm"> FCFA/mois</span>
              </div>
              {plan.price_xof > 0 && (
                <p className="text-white/30 text-xs mb-4">≈ {plan.price_eur}€/mois</p>
              )}

              <p className="text-primary-400 text-sm font-medium mb-5">
                {plan.videos_per_month === -1 ? '∞ vidéos/mois' : `${plan.videos_per_month} vidéos/mois`}
              </p>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-white/60 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || loading === plan.id}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-green-500/20 text-green-400 cursor-default border border-green-500/20'
                    : isPopular
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  'Plan actuel'
                ) : plan.id === 'free' ? (
                  'Commencer'
                ) : (
                  'Choisir ce plan'
                )}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Payment methods */}
      <div className="mt-12 text-center">
        <p className="text-white/40 text-sm mb-4">Moyens de paiement acceptés</p>
        <div className="flex flex-wrap justify-center gap-4">
          {['📱 MTN Mobile Money', '📱 Orange Money', '📱 Wave', '💳 Moov Money', '🏦 Visa/Mastercard'].map((m, i) => (
            <span key={i} className="glass-card px-4 py-2 text-white/60 text-sm">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )

  if (isDashboard) return content

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Navbar />
      <div className="px-4 pb-24">{content}</div>
    </div>
  )
}
