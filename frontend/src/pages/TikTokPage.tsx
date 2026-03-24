import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Music2, Upload, Send, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { tiktokApi, youtubeApi } from '../lib/api'
import clsx from 'clsx'

type Privacy = 'PUBLIC_TO_EVERYONE' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'

const PRIVACY_LABELS: Record<Privacy, string> = {
  PUBLIC_TO_EVERYONE: 'Public',
  FOLLOWER_OF_CREATOR: 'Abonnés seulement',
  SELF_ONLY: 'Privé (moi)',
}

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

function PostCard({ post }: { post: any }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  useQuery({
    queryKey: ['tiktok-status', post.id],
    queryFn: () => tiktokApi.status(post.id).then(r => r.data),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return s === 'running' || s === 'pending' ? 4000 : false
    },
    onSuccess: (data) => {
      if (data.status !== post.status) {
        qc.invalidateQueries({ queryKey: ['tiktok-posts'] })
      }
    },
  } as any)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shrink-0">
            <Music2 size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-white truncate">{post.tweet_content || post.niche || '—'}</p>
            {post.youtube_url && (
              <p className="text-xs text-zinc-400 mt-0.5">publish_id: {post.youtube_url}</p>
            )}
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(post.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={post.status} />
          {post.logs && (
            <button onClick={() => setOpen(v => !v)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && post.logs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <pre className="bg-zinc-900/60 rounded-lg p-3 text-xs text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
              {post.logs}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {post.error_message && (
        <p className="mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {post.error_message}
        </p>
      )}
    </motion.div>
  )
}

export default function TikTokPage() {
  const qc = useQueryClient()

  // Tab: 'from-yt' or 'custom-path'
  const [tab, setTab] = useState<'from-yt' | 'custom'>('from-yt')

  // From YouTube task form
  const [ytTaskId, setYtTaskId] = useState('')
  const [ytCaption, setYtCaption] = useState('')
  const [ytPrivacy, setYtPrivacy] = useState<Privacy>('PUBLIC_TO_EVERYONE')

  // Custom video path form
  const [videoPath, setVideoPath] = useState('')
  const [topic, setTopic] = useState('')
  const [caption, setCaption] = useState('')
  const [privacy, setPrivacy] = useState<Privacy>('PUBLIC_TO_EVERYONE')

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['tiktok-posts'],
    queryFn: () => tiktokApi.posts().then(r => r.data),
    refetchInterval: 8000,
  })

  const { data: ytTasksData } = useQuery({
    queryKey: ['youtube-tasks-for-tiktok'],
    queryFn: () => youtubeApi.tasks(0, 50).then(r => r.data),
  })
  const completedYtTasks = (ytTasksData || []).filter((t: any) => t.status === 'completed' && t.video_path)

  const postFromYT = useMutation({
    mutationFn: () => tiktokApi.postFromYouTube(
      parseInt(ytTaskId), undefined, ytCaption || undefined, ytPrivacy
    ),
    onSuccess: () => {
      toast.success('Publication TikTok lancée!')
      qc.invalidateQueries({ queryKey: ['tiktok-posts'] })
      setYtTaskId(''); setYtCaption('')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Erreur'),
  })

  const postCustom = useMutation({
    mutationFn: () => tiktokApi.post(videoPath, topic, caption || undefined, privacy),
    onSuccess: () => {
      toast.success('Publication TikTok lancée!')
      qc.invalidateQueries({ queryKey: ['tiktok-posts'] })
      setVideoPath(''); setTopic(''); setCaption('')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Erreur'),
  })

  const isBusy = postFromYT.isPending || postCustom.isPending
  const canSubmitYT = ytTaskId && !isBusy
  const canSubmitCustom = videoPath && topic && !isBusy

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
            <Music2 size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TikTok Publisher</h1>
        </div>
        <p className="text-zinc-400 text-sm ml-13">
          Publiez vos vidéos courtes sur TikTok via l'API officielle Content Posting.
        </p>
      </div>

      {/* Form card */}
      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 bg-zinc-800/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('from-yt')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === 'from-yt'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            Depuis YouTube Shorts
          </button>
          <button
            onClick={() => setTab('custom')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === 'custom'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            Chemin personnalisé
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'from-yt' ? (
            <motion.div key="from-yt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="label">Vidéo YouTube générée</label>
                {completedYtTasks.length === 0 ? (
                  <p className="text-sm text-zinc-500 mt-1">
                    Aucune vidéo YouTube générée. Allez dans <strong>YouTube Shorts</strong> pour en créer une.
                  </p>
                ) : (
                  <select
                    className="input mt-1 w-full"
                    value={ytTaskId}
                    onChange={e => setYtTaskId(e.target.value)}
                  >
                    <option value="">— Choisir une vidéo —</option>
                    {completedYtTasks.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} — {t.title || t.niche} ({new Date(t.created_at).toLocaleDateString('fr-FR')})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="label">Légende (optionnel — générée par IA si vide)</label>
                <textarea
                  className="input mt-1 w-full h-24 resize-none"
                  placeholder="Une légende accrocheuse avec des hashtags…"
                  value={ytCaption}
                  onChange={e => setYtCaption(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Confidentialité</label>
                <select className="input mt-1 w-full" value={ytPrivacy} onChange={e => setYtPrivacy(e.target.value as Privacy)}>
                  {Object.entries(PRIVACY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => postFromYT.mutate()}
                disabled={!canSubmitYT}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {postFromYT.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {postFromYT.isPending ? 'Publication en cours…' : 'Publier sur TikTok'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="label">Chemin de la vidéo (serveur)</label>
                <input
                  className="input mt-1 w-full"
                  placeholder="/app/uploads/videos/ma_video.mp4"
                  value={videoPath}
                  onChange={e => setVideoPath(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Sujet / niche</label>
                <input
                  className="input mt-1 w-full"
                  placeholder="Finance personnelle, fitness, cuisine…"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Légende (optionnel)</label>
                <textarea
                  className="input mt-1 w-full h-24 resize-none"
                  placeholder="Légende personnalisée avec hashtags…"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Confidentialité</label>
                <select className="input mt-1 w-full" value={privacy} onChange={e => setPrivacy(e.target.value as Privacy)}>
                  {Object.entries(PRIVACY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => postCustom.mutate()}
                disabled={!canSubmitCustom}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {postCustom.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {postCustom.isPending ? 'Publication en cours…' : 'Publier sur TikTok'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Historique TikTok</h2>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['tiktok-posts'] })}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-pink-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-zinc-500">
            <Music2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucune publication TikTok pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
