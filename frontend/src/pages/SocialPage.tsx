import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Share2, Upload, Send, ChevronDown, ChevronUp, Clock,
  CheckCircle2, XCircle, Loader2, RefreshCw, Facebook, Instagram, Linkedin,
} from 'lucide-react'
import { socialApi, youtubeApi } from '../lib/api'
import clsx from 'clsx'

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,  color: 'text-blue-500' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: Linkedin,  color: 'text-sky-500' },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending:   { label: 'En attente',  cls: 'badge-status-pending',   icon: Clock },
    running:   { label: 'En cours',    cls: 'badge-status-running',   icon: Loader2 },
    completed: { label: 'Publié',      cls: 'badge-status-completed', icon: CheckCircle2 },
    failed:    { label: 'Échoué',      cls: 'badge-status-failed',    icon: XCircle },
  }
  const s = map[status] ?? map.pending
  const Icon = s.icon
  return (
    <span className={clsx('badge-status', s.cls, 'inline-flex items-center gap-1')}>
      <Icon size={12} className={status === 'running' ? 'animate-spin' : ''} />
      {s.label}
    </span>
  )
}

function PlatformResults({ resultsJson }: { resultsJson?: string | null }) {
  if (!resultsJson) return null
  let results: Record<string, any> = {}
  try { results = JSON.parse(resultsJson) } catch { return null }

  return (
    <div className="mt-2 space-y-1">
      {Object.entries(results).map(([platform, res]: [string, any]) => {
        const pInfo = PLATFORMS.find(p => p.id === platform)
        const Icon = pInfo?.icon ?? Share2
        const ok = res.status === 'published' || res.status === 'completed'
        return (
          <div key={platform} className="flex items-center gap-2 text-xs">
            <Icon size={12} className={pInfo?.color ?? 'text-white/40'} />
            <span className="text-white/60 capitalize">{platform}:</span>
            {ok
              ? <span className="text-green-400">publié</span>
              : <span className="text-red-400">{res.reason || res.error || res.status}</span>
            }
          </div>
        )
      })}
    </div>
  )
}

function PostCard({ post }: { post: any }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  useQuery({
    queryKey: ['social-status', post.id],
    queryFn: () => socialApi.status(post.id).then(r => r.data),
    refetchInterval: (q: any) => {
      const s = q.state.data?.status
      return s === 'running' || s === 'pending' ? 4000 : false
    },
    onSuccess: (data: any) => {
      if (data.status !== post.status) qc.invalidateQueries({ queryKey: ['social-posts'] })
    },
  } as any)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{post.title}</p>
          <p className="text-white/30 text-xs mt-0.5">
            {new Date(post.created_at).toLocaleString('fr-FR')}
          </p>
          <PlatformResults resultsJson={post.tweet_content} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={post.status} />
          <button onClick={() => setOpen(o => !o)} className="text-white/30 hover:text-white transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && post.logs && (
          <motion.pre initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 bg-black/40 rounded-lg p-3 text-xs text-white/50 overflow-x-auto font-mono whitespace-pre-wrap">
            {post.logs}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function SocialPage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'custom' | 'youtube'>('custom')
  const [videoPath, setVideoPath] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORMS.map(p => p.id))
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [ytTaskId, setYtTaskId] = useState('')

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => socialApi.posts().then(r => r.data),
    refetchInterval: 8000,
  })

  const { data: ytTasks } = useQuery({
    queryKey: ['youtube-tasks'],
    queryFn: () => youtubeApi.tasks().then(r => r.data),
  })

  const postMutation = useMutation({
    mutationFn: () => {
      if (mode === 'youtube' && ytTaskId) {
        return socialApi.postFromYouTube(parseInt(ytTaskId), topic, selectedPlatforms).then(r => r.data)
      }
      return socialApi.post(videoPath, topic, selectedPlatforms, captions).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Publication en cours...')
      qc.invalidateQueries({ queryKey: ['social-posts'] })
      setVideoPath(''); setTopic(''); setYtTaskId('')
      setCaptions({})
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Erreur de publication'),
  })

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const canSubmit = topic.trim() && selectedPlatforms.length > 0 &&
    (mode === 'youtube' ? !!ytTaskId : !!videoPath.trim())

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Social Media</h1>
            <p className="text-white/40 text-sm">Facebook · Instagram · LinkedIn</p>
          </div>
        </div>

        {/* Info */}
        <div className="glass p-4 mb-5 bg-blue-500/5 border-blue-500/20">
          <p className="text-white/60 text-sm">
            Publication via <strong className="text-white">cookies de navigateur</strong> (Playwright).
            Exportez vos cookies depuis votre navigateur connecté et collez-les dans
            <strong className="text-white"> Paramètres → Social Media</strong>.
          </p>
        </div>

        {/* Form */}
        <div className="glass p-6 space-y-5">

          {/* Mode */}
          <div className="flex gap-2">
            {(['custom', 'youtube'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                  mode === m
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-white/5 text-white/40 hover:text-white'
                )}>
                {m === 'custom' ? (
                  <><Upload size={14} className="inline mr-1.5" />Chemin vidéo</>
                ) : (
                  <><RefreshCw size={14} className="inline mr-1.5" />Depuis YouTube</>
                )}
              </button>
            ))}
          </div>

          {/* Platforms selector */}
          <div>
            <label className="label">Plateformes</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
                <button key={id} onClick={() => togglePlatform(id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all border',
                    selectedPlatforms.includes(id)
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/3 text-white/30 border-white/5 hover:text-white/60'
                  )}>
                  <Icon size={14} className={selectedPlatforms.includes(id) ? color : ''} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="label">Sujet / Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Ex: IA pour les entrepreneurs africains"
              className="input" />
            <p className="text-white/25 text-xs mt-1">Utilisé pour générer les légendes IA si non fournies.</p>
          </div>

          {/* Source */}
          {mode === 'custom' ? (
            <div>
              <label className="label">Chemin vers la vidéo</label>
              <input value={videoPath} onChange={e => setVideoPath(e.target.value)}
                placeholder="/home/user/Videomachine/backend/uploads/videos/xxx.mp4"
                className="input font-mono text-sm" />
            </div>
          ) : (
            <div>
              <label className="label">Tâche YouTube terminée</label>
              <select value={ytTaskId} onChange={e => setYtTaskId(e.target.value)} className="input">
                <option value="">-- Sélectionnez une tâche --</option>
                {(ytTasks || [])
                  .filter((t: any) => t.status === 'completed' && t.video_path)
                  .map((t: any) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} — {t.title || t.niche}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Optional per-platform captions */}
          {selectedPlatforms.length > 0 && (
            <div>
              <label className="label">Légendes personnalisées (optionnel)</label>
              <div className="space-y-2">
                {selectedPlatforms.map(pid => {
                  const pInfo = PLATFORMS.find(p => p.id === pid)!
                  const Icon = pInfo.icon
                  return (
                    <div key={pid} className="flex items-center gap-2">
                      <Icon size={14} className={pInfo.color} />
                      <input
                        value={captions[pid] || ''}
                        onChange={e => setCaptions(c => ({ ...c, [pid]: e.target.value }))}
                        placeholder={`Légende ${pInfo.label} (laissez vide = IA)`}
                        className="input flex-1 text-sm"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button onClick={() => postMutation.mutate()} disabled={!canSubmit || postMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {postMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Publication en cours...</>
              : <><Send className="w-4 h-4" /> Publier sur {selectedPlatforms.length} plateforme(s)</>
            }
          </button>
        </div>

        {/* Posts history */}
        <div className="mt-8">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Share2 size={16} />Historique des publications
          </h2>
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : !posts?.length ? (
            <div className="glass p-8 text-center text-white/30 text-sm">
              Aucune publication pour l'instant.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p: any) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>

      </motion.div>
    </div>
  )
}
