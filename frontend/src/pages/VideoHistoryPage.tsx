import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Video, Download, Trash2, Eye, Clock, CheckCircle,
  AlertCircle, Loader2, Play, Plus
} from 'lucide-react'
import { videosApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function formatDuration(seconds: number | null) {
  if (!seconds) return '--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number | null) {
  if (!bytes) return '--'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-400" />
  if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-400" />
  if (status === 'processing') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
  return <Clock className="w-4 h-4 text-yellow-400" />
}

export default function VideoHistoryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<number | null>(null)
  const [preview, setPreview] = useState<any | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['all-videos'],
    queryFn: () => videosApi.list(0, 50),
    refetchInterval: 5000, // Poll for updates
  })
  const videos = data?.data || []

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette vidéo?')) return
    setDeleting(id)
    try {
      await videosApi.delete(id)
      toast.success('Vidéo supprimée')
      queryClient.invalidateQueries({ queryKey: ['all-videos'] })
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = async (video: any) => {
    try {
      await videosApi.download(video.id)
      if (video.video_url) {
        const a = document.createElement('a')
        a.href = video.video_url
        a.download = `${video.title}.mp4`
        a.click()
      }
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Mes Vidéos</h1>
            <p className="text-white/50 text-sm mt-1">{videos.length} vidéo{videos.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => navigate('/dashboard/generate')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle vidéo
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
          </div>
        ) : videos.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Aucune vidéo</h3>
            <p className="text-white/50 mb-6">Créez votre première vidéo en quelques secondes</p>
            <button onClick={() => navigate('/dashboard/generate')} className="btn-primary">
              Créer ma première vidéo
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {videos.map((video: any) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-4 flex items-center gap-4 hover:border-white/20 transition-all"
              >
                {/* Thumbnail */}
                <div
                  className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-purple-600/20 rounded-xl flex-shrink-0 overflow-hidden cursor-pointer relative group"
                  onClick={() => video.status === 'completed' && setPreview(video)}
                >
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-7 h-7 text-white/30" />
                    </div>
                  )}
                  {video.status === 'completed' && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusIcon status={video.status} />
                    <p className="text-white font-medium truncate">{video.title}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-white/40 text-xs">
                    <span>{new Date(video.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {video.duration && <span>⏱ {formatDuration(video.duration)}</span>}
                    {video.file_size && <span>💾 {formatSize(video.file_size)}</span>}
                    <span>👁 {video.views} vues</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {video.status === 'completed' && (
                    <>
                      <button
                        onClick={() => setPreview(video)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        title="Prévisualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(video)}
                        className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-all"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deleting === video.id}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
                    title="Supprimer"
                  >
                    {deleting === video.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Video Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setPreview(null)} className="absolute -top-10 right-0 text-white/60 hover:text-white">
              ✕ Fermer
            </button>
            {preview.video_url && (
              <video
                src={preview.video_url}
                controls
                autoPlay
                className="w-full rounded-2xl shadow-2xl"
                style={{ maxHeight: '80vh' }}
              />
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={() => handleDownload(preview)} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2">
                <Download className="w-4 h-4" /> Télécharger
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
