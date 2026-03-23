import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Play, Download, Trash2, Upload, CheckCircle, AlertCircle, Loader2, Clock, Plus, ExternalLink } from 'lucide-react'
import { youtubeApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

const LANGS = ['French','English','Spanish','Portuguese','Arabic','German','Italian','Dutch']

function TaskCard({ task, onDelete, onUpload }: { task: any, onDelete: () => void, onUpload: () => void }) {
  const statusIcon = { pending: <Clock className="w-4 h-4 text-yellow-400" />, running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />, completed: <CheckCircle className="w-4 h-4 text-green-400" />, failed: <AlertCircle className="w-4 h-4 text-red-400" /> }
  const statusLabel = { pending: 'En attente', running: 'En cours', completed: 'Terminée', failed: 'Échoué' }
  const [showLogs, setShowLogs] = useState(false)

  return (
    <div className="glass p-5">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 relative">
          {task.thumbnail_url ? <img src={task.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-white/20" /></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusIcon[task.status as keyof typeof statusIcon]}
            <p className="text-white font-semibold text-sm truncate">{task.title || task.niche}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/40 mb-2">
            <span>{statusLabel[task.status as keyof typeof statusLabel]}</span>
            <span>·</span><span>{task.language}</span>
            <span>·</span><span>{new Date(task.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          {task.youtube_url && (
            <a href={task.youtube_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
              <ExternalLink className="w-3 h-3" /> Voir sur YouTube
            </a>
          )}
          {task.error_message && <p className="text-red-400/80 text-xs mt-1 truncate">{task.error_message}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {task.status === 'completed' && task.video_url && (
            <>
              <a href={task.video_url} target="_blank" rel="noreferrer"
                className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-all" title="Prévisualiser">
                <Play className="w-4 h-4" />
              </a>
              <a href={task.video_url} download
                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all" title="Télécharger">
                <Download className="w-4 h-4" />
              </a>
              {!task.youtube_url && (
                <button onClick={onUpload}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all" title="Upload YouTube">
                  <Upload className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button onClick={onDelete} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs toggle */}
      {task.logs && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <button onClick={() => setShowLogs(!showLogs)} className="text-xs text-white/30 hover:text-white/60">
            {showLogs ? '▲ Masquer logs' : '▼ Voir logs'}
          </button>
          {showLogs && (
            <pre className="mt-2 text-xs text-white/50 bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
              {task.logs}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default function YouTubePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [niche, setNiche] = useState('')
  const [lang, setLang] = useState('French')
  const [loading, setLoading] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const [preview, setPreview] = useState<any | null>(null)

  const { data, refetch } = useQuery({
    queryKey: ['yt-tasks'],
    queryFn: () => youtubeApi.tasks(0, 30),
    refetchInterval: activeTaskId ? 4000 : false,
  })
  const tasks = data?.data || []

  const isRunning = tasks.some((t: any) => ['pending','running'].includes(t.status))

  const generate = async () => {
    if (!niche.trim()) { toast.error('Entrez une niche/sujet'); return }
    const atLimit = user?.videos_limit !== -1 && (user?.videos_generated ?? 0) >= (user?.videos_limit ?? 0)
    if (atLimit) { toast.error('Limite atteinte. Upgradez votre plan.'); return }
    setLoading(true)
    try {
      const r = await youtubeApi.generate(niche, lang)
      setActiveTaskId(r.data.id)
      toast.success('Génération démarrée!')
      setNiche('')
      refetch()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur') }
    finally { setLoading(false) }
  }

  const deleteTask = async (id: number) => {
    if (!confirm('Supprimer cette tâche?')) return
    try { await youtubeApi.delete(id); refetch(); toast.success('Supprimé') }
    catch { toast.error('Erreur suppression') }
  }

  const uploadTask = async (id: number) => {
    try { await youtubeApi.upload(id); refetch(); toast.success('Upload démarré!') }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur upload') }
  }

  const atLimit = user?.videos_limit !== -1 && (user?.videos_generated ?? 0) >= (user?.videos_limit ?? 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">YouTube Shorts Automation</h1>
            <p className="text-white/40 text-sm">MoneyPrinterV2 — Topic → Script → Images IA → TTS → Montage → Upload</p>
          </div>
        </div>

        {/* Generate Form */}
        <div className="glass p-6 mb-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-400" /> Nouvelle vidéo
          </h2>

          {atLimit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400">
              Limite atteinte ({user?.videos_generated}/{user?.videos_limit}). Upgradez pour continuer.
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="label">Niche / Sujet *</label>
              <input value={niche} onChange={e => setNiche(e.target.value)}
                placeholder="Ex: Comment gagner de l'argent avec les crypto..." className="input"
                onKeyDown={e => e.key === 'Enter' && generate()} />
            </div>
            <div>
              <label className="label">Langue</label>
              <select value={lang} onChange={e => setLang(e.target.value)} className="input">
                {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-xs">
              La génération prend ~2-5 min selon votre modèle Ollama
            </p>
            <button onClick={generate} disabled={loading || atLimit || isRunning}
              className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {loading ? 'Démarrage...' : isRunning ? 'En cours...' : 'Générer'}
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h2 className="text-white font-bold">Historique ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <div className="glass p-12 text-center">
              <Video className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">Aucune vidéo générée</p>
            </div>
          ) : (
            tasks.map((t: any) => (
              <TaskCard key={t.id} task={t} onDelete={() => deleteTask(t.id)} onUpload={() => uploadTask(t.id)} />
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
