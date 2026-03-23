import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Plus, Video, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { videosApi } from '../lib/api'
import { useAuthStore } from '../lib/store'

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: videosData } = useQuery({
    queryKey: ['videos'],
    queryFn: () => videosApi.list(0, 5),
  })

  const videos = videosData?.data || []
  const completed = videos.filter((v: any) => v.status === 'completed').length
  const processing = videos.filter((v: any) => v.status === 'processing' || v.status === 'pending').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-white">
          {greeting}, <span className="gradient-text">{user?.username}</span>!
        </h1>
        <p className="text-white/50 mt-1">
          {user?.plan === 'free'
            ? `Plan gratuit — ${user.videos_generated}/${user.videos_limit} vidéos utilisées`
            : `Plan ${user?.plan} — ${user?.videos_limit === -1 ? 'Illimité' : `${user?.videos_generated}/${user?.videos_limit}`} vidéos`}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Video} label="Total vidéos" value={user?.videos_generated || 0} color="bg-primary-500/20" />
        <StatCard icon={CheckCircle} label="Complétées" value={completed} color="bg-green-500/20" />
        <StatCard icon={Clock} label="En cours" value={processing} color="bg-orange-500/20" />
        <StatCard icon={TrendingUp} label="Restantes" value={user?.videos_limit === -1 ? '∞' : Math.max(0, (user?.videos_limit || 0) - (user?.videos_generated || 0))} color="bg-purple-500/20" />
      </div>

      {/* Quick Generate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-8 bg-gradient-to-br from-primary-500/10 to-purple-600/10 border-primary-500/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Générer une nouvelle vidéo</h2>
            <p className="text-white/50 text-sm">Entrez votre sujet et laissez l'IA faire le reste en moins de 2 min</p>
          </div>
          <button onClick={() => navigate('/dashboard/generate')} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nouvelle vidéo
          </button>
        </div>
      </motion.div>

      {/* Recent Videos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Vidéos récentes</h2>
          <button onClick={() => navigate('/dashboard/videos')} className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
            Voir tout <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Vous n'avez pas encore de vidéos</p>
            <button onClick={() => navigate('/dashboard/generate')} className="btn-primary">
              Créer ma première vidéo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video: any) => (
              <div key={video.id} className="glass-card p-4 flex items-center gap-4 hover:border-white/20 transition-all">
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-purple-600/20 rounded-lg flex-shrink-0 overflow-hidden">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-white/30" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{video.title}</p>
                  <p className="text-white/40 text-xs mt-1">{new Date(video.created_at).toLocaleDateString('fr-FR')}</p>
                </div>

                <StatusBadge status={video.status} />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Upgrade banner for free users */}
      {user?.plan === 'free' && (user?.videos_generated || 0) >= (user?.videos_limit || 3) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 glass-card p-6 border-accent-500/30 bg-accent-500/5"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-accent-500" />
            <div className="flex-1">
              <p className="text-white font-semibold">Limite atteinte</p>
              <p className="text-white/50 text-sm">Passez au plan Pro pour continuer à générer des vidéos</p>
            </div>
            <button onClick={() => navigate('/dashboard/pricing')} className="btn-primary">
              Upgrader
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: 'bg-yellow-500/20 text-yellow-400', label: 'En attente' },
    processing: { color: 'bg-blue-500/20 text-blue-400', label: 'En cours...' },
    completed: { color: 'bg-green-500/20 text-green-400', label: 'Terminée' },
    failed: { color: 'bg-red-500/20 text-red-400', label: 'Échec' },
  }
  const c = config[status as keyof typeof config] || config.pending
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${c.color}`}>{c.label}</span>
}
