import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link2, Send, CheckCircle, AlertCircle, Loader2, Clock, Info } from 'lucide-react'
import { afmApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function AffiliatePage() {
  const [link, setLink] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, refetch } = useQuery({
    queryKey: ['afm-tasks'],
    queryFn: () => afmApi.tasks(),
    refetchInterval: 5000,
  })
  const tasks = data?.data || []

  const run = async () => {
    if (!link.trim() || !topic.trim()) { toast.error('Remplissez tous les champs'); return }
    if (!link.startsWith('http')) { toast.error('Lien affilié invalide (doit commencer par http)'); return }
    setLoading(true)
    try {
      await afmApi.run(link, topic)
      toast.success('Campagne AFM démarrée!')
      setLink(''); setTopic('')
      refetch()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur') }
    finally { setLoading(false) }
  }

  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-yellow-400" />,
    running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-green-400" />,
    failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Affiliate Marketing</h1>
            <p className="text-white/40 text-sm">MoneyPrinterV2 — Scrape Amazon → Génère pitch IA → Post Twitter</p>
          </div>
        </div>

        {/* Info box */}
        <div className="glass p-4 mb-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/60 text-sm">
              Fournissez un lien produit Amazon affilié. MoneyPrinterV2 va scraper le produit via Firefox,
              générer un pitch avec Ollama IA, puis le partager automatiquement sur votre compte Twitter connecté.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="glass p-6 mb-6">
          <h2 className="text-white font-bold mb-4">Nouvelle campagne AFM</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Lien affilié Amazon *</label>
              <input value={link} onChange={e => setLink(e.target.value)}
                placeholder="https://www.amazon.com/dp/B0XXXXX?tag=votre-tag" className="input" />
            </div>
            <div>
              <label className="label">Topic Twitter (pour le compte) *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Ex: Technologie, Fitness, Marketing digital..." className="input" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-5">
            <p className="text-white/30 text-xs">Requiert Firefox profile + compte Twitter connectés (Paramètres)</p>
            <button onClick={run} disabled={loading}
              className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Démarrage...' : 'Lancer la campagne'}
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-white font-bold mb-3">Historique ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <div className="glass p-10 text-center">
              <Link2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Aucune campagne lancée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t: any) => (
                <div key={t.id} className="glass p-5">
                  <div className="flex items-start gap-3 mb-2">
                    {statusIcon[t.status as keyof typeof statusIcon]}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{t.affiliate_link}</p>
                      <p className="text-white/30 text-xs mt-0.5">{new Date(t.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                  {t.pitch && (
                    <div className="mt-2 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm italic leading-relaxed">{t.pitch}</p>
                    </div>
                  )}
                  {t.error_message && <p className="text-red-400 text-xs mt-2">{t.error_message}</p>}
                  {t.logs && (
                    <details className="mt-2">
                      <summary className="text-white/30 text-xs cursor-pointer">Voir logs</summary>
                      <pre className="mt-1 text-xs text-white/30 bg-black/20 rounded p-2 max-h-24 overflow-y-auto font-mono">{t.logs}</pre>
                    </details>
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
