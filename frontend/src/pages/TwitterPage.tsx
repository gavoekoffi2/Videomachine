import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Twitter, Send, CheckCircle, AlertCircle, Loader2, Clock, Zap } from 'lucide-react'
import { twitterApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function TwitterPage() {
  const [topic, setTopic] = useState('')
  const [custom, setCustom] = useState('')
  const [mode, setMode] = useState<'ai' | 'custom'>('ai')
  const [loading, setLoading] = useState(false)

  const { data, refetch } = useQuery({
    queryKey: ['twitter-posts'],
    queryFn: () => twitterApi.posts(0, 50),
    refetchInterval: 5000,
  })
  const posts = data?.data || []
  const running = posts.some((p: any) => ['pending','running'].includes(p.status))

  const post = async () => {
    if (!topic.trim()) { toast.error('Entrez un sujet/topic'); return }
    if (mode === 'custom' && !custom.trim()) { toast.error('Entrez le texte du tweet'); return }
    setLoading(true)
    try {
      await twitterApi.post(topic, mode === 'custom' ? custom : undefined)
      toast.success('Tweet démarré!')
      setTopic(''); setCustom('')
      refetch()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur') }
    finally { setLoading(false) }
  }

  const statusIcon = {
    pending: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
    running: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />,
    completed: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
    failed: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Twitter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Twitter / X Bot</h1>
            <p className="text-white/40 text-sm">MoneyPrinterV2 — Génère et publie des tweets via Selenium/Firefox</p>
          </div>
        </div>

        {/* Post Form */}
        <div className="glass p-6 mb-6">
          <h2 className="text-white font-bold mb-4">Nouveau Tweet</h2>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('ai')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'ai' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-white/40 hover:text-white/60 bg-white/5'}`}>
              <Zap className="w-3.5 h-3.5 inline mr-1" /> Généré par IA
            </button>
            <button onClick={() => setMode('custom')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'custom' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-white/40 hover:text-white/60 bg-white/5'}`}>
              Texte personnalisé
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Sujet / Topic *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Investissement crypto, santé naturelle..." className="input" />
            </div>
            {mode === 'custom' && (
              <div>
                <label className="label">Texte du tweet * (max 260 car.)</label>
                <textarea value={custom} onChange={e => setCustom(e.target.value)} maxLength={260} rows={3}
                  placeholder="Votre tweet personnalisé..." className="input resize-none" />
                <p className="text-white/30 text-xs text-right mt-1">{custom.length}/260</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-xs">Requiert un Firefox profile connecté à X/Twitter (voir Paramètres)</p>
            <button onClick={post} disabled={loading || running}
              className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Démarrage...' : 'Publier'}
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-white font-bold mb-3">Historique ({posts.length})</h2>
          {posts.length === 0 ? (
            <div className="glass p-10 text-center">
              <Twitter className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Aucun tweet envoyé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((p: any) => (
                <div key={p.id} className="glass p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{statusIcon[p.status as keyof typeof statusIcon]}</div>
                    <div className="flex-1 min-w-0">
                      {p.tweet_content ? (
                        <p className="text-white/80 text-sm leading-relaxed">{p.tweet_content}</p>
                      ) : (
                        <p className="text-white/40 text-sm italic">
                          {p.status === 'running' ? 'Génération du tweet...' : p.title || 'Tweet en cours'}
                        </p>
                      )}
                      {p.error_message && <p className="text-red-400 text-xs mt-1">{p.error_message}</p>}
                      <p className="text-white/25 text-xs mt-1.5">{new Date(p.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                  {p.logs && p.status === 'failed' && (
                    <pre className="mt-2 text-xs text-white/30 bg-black/20 rounded-lg p-2 max-h-24 overflow-y-auto font-mono">{p.logs}</pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
