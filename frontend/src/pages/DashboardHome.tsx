import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Video, Twitter, Link2, Settings, ArrowRight, CheckCircle, Clock, AlertCircle, Loader2, Play } from 'lucide-react'
import { youtubeApi } from '../lib/api'
import { useAuthStore } from '../lib/store'

const quickActions = [
  { to: '/dashboard/youtube', icon: Video, color: 'from-red-500 to-orange-500', title: 'YouTube Shorts', desc: 'Générer une nouvelle vidéo courte avec IA' },
  { to: '/dashboard/twitter', icon: Twitter, color: 'from-sky-500 to-blue-600', title: 'Twitter Bot', desc: 'Publier un tweet généré par IA' },
  { to: '/dashboard/affiliate', icon: Link2, color: 'from-green-500 to-teal-500', title: 'Affiliate Marketing', desc: 'Créer et partager un pitch affilié' },
  { to: '/dashboard/settings', icon: Settings, color: 'from-purple-500 to-pink-500', title: 'Paramètres', desc: 'Configurer Ollama, API keys, Firefox' },
]

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string, label: string, icon: any }> = {
    pending:   { cls: 'badge-status-pending',   label: 'En attente', icon: Clock },
    running:   { cls: 'badge-status-running',   label: 'En cours',   icon: Loader2 },
    completed: { cls: 'badge-status-completed', label: 'Terminée',   icon: CheckCircle },
    failed:    { cls: 'badge-status-failed',    label: 'Échec',      icon: AlertCircle },
  }
  const c = cfg[status] || cfg.pending
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${c.cls}`}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />{c.label}
    </span>
  )
}

export default function DashboardHome() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data } = useQuery({ queryKey: ['yt-tasks-home'], queryFn: () => youtubeApi.tasks(0, 5) })
  const tasks = data?.data || []
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-black text-white">{greet}, <span className="gradient-text">{user?.username}</span>!</h1>
        <p className="text-white/40 text-sm mt-1">
          Plan {user?.plan} — {user?.videos_limit === -1 ? 'Vidéos illimitées' : `${user?.videos_generated}/${user?.videos_limit} vidéos ce mois`}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Vidéos générées', value: user?.videos_generated ?? 0, color: 'text-primary-400' },
          { label: 'Restantes', value: user?.videos_limit === -1 ? '∞' : Math.max(0, (user?.videos_limit ?? 0) - (user?.videos_generated ?? 0)), color: 'text-green-400' },
          { label: 'Complétées', value: tasks.filter((t: any) => t.status === 'completed').length, color: 'text-blue-400' },
          { label: 'En cours', value: tasks.filter((t: any) => ['running','pending'].includes(t.status)).length, color: 'text-yellow-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
            className="glass p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        <h2 className="text-white font-bold mb-3">Actions rapides</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.to)}
              className="glass p-5 flex items-center gap-4 text-left hover:border-white/20 transition-all hover:-translate-y-0.5 group">
              <div className={`w-11 h-11 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{a.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{a.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent YouTube Tasks */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold">Vidéos récentes</h2>
          <button onClick={() => navigate('/dashboard/youtube')} className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="glass p-10 text-center">
            <Video className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-4">Aucune vidéo générée</p>
            <button onClick={() => navigate('/dashboard/youtube')} className="btn-primary text-sm">
              Générer ma première vidéo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t: any) => (
              <div key={t.id} className="glass p-4 flex items-center gap-4 hover:border-white/20 transition-all">
                <div className="w-14 h-14 bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                  {t.thumbnail_url ? (
                    <img src={t.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.title || t.niche}</p>
                  <p className="text-white/30 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <StatusBadge status={t.status} />
                {t.status === 'completed' && t.video_url && (
                  <a href={t.video_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <Play className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
