import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Zap, Brain, Mic2, Globe, Image, Sparkles,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react'
import { videosApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

const styles = [
  { id: 'motivational', emoji: '🔥', name: 'Motivationnel' },
  { id: 'educational', emoji: '📚', name: 'Éducatif' },
  { id: 'news', emoji: '📰', name: 'Actualités' },
  { id: 'story', emoji: '📖', name: 'Histoire' },
  { id: 'marketing', emoji: '💼', name: 'Marketing' },
]

const resolutions = [
  { id: '1080x1920', label: '9:16 Portrait', desc: 'TikTok, Shorts, Reels', icon: '📱' },
  { id: '1920x1080', label: '16:9 Paysage', desc: 'YouTube classique', icon: '🖥️' },
  { id: '1080x1080', label: '1:1 Carré', desc: 'Instagram Feed', icon: '⬛' },
]

export default function GeneratePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('fr')
  const [style, setStyle] = useState('motivational')
  const [voiceName, setVoiceName] = useState('fr-FR-DeniseNeural')
  const [resolution, setResolution] = useState('1080x1920')
  const [generating, setGenerating] = useState(false)
  const [generatedVideoId, setGeneratedVideoId] = useState<number | null>(null)
  const [videoStatus, setVideoStatus] = useState<string | null>(null)

  const { data: optionsData } = useQuery({
    queryKey: ['video-options'],
    queryFn: () => videosApi.options(),
  })
  const voices = optionsData?.data?.voices?.[language] || []

  // Poll video status
  useEffect(() => {
    if (!generatedVideoId || videoStatus === 'completed' || videoStatus === 'failed') return
    const interval = setInterval(async () => {
      try {
        const res = await videosApi.status(generatedVideoId)
        setVideoStatus(res.data.status)
        if (res.data.status === 'completed') {
          toast.success('Votre vidéo est prête!')
          clearInterval(interval)
          setTimeout(() => navigate('/dashboard/videos'), 2000)
        } else if (res.data.status === 'failed') {
          toast.error('Erreur lors de la génération. Réessayez.')
          clearInterval(interval)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [generatedVideoId, videoStatus])

  const atLimit = user?.videos_limit !== -1 && (user?.videos_generated || 0) >= (user?.videos_limit || 0)

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Entrez un sujet'); return }
    if (atLimit) { toast.error('Limite de vidéos atteinte. Upgradez votre plan.'); return }

    setGenerating(true)
    setVideoStatus(null)
    try {
      const res = await videosApi.generate({
        topic, language, style, voice_name: voiceName, resolution, music_type: 'upbeat'
      })
      setGeneratedVideoId(res.data.id)
      setVideoStatus('processing')
      toast.success('Génération démarrée!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors du démarrage')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Générer une vidéo</h1>
            <p className="text-white/50 text-sm">L'IA crée tout en moins de 2 minutes</p>
          </div>
        </div>

        {atLimit && (
          <div className="glass-card p-4 border-accent-500/30 bg-accent-500/5 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Limite atteinte ({user?.videos_generated}/{user?.videos_limit})</p>
              <p className="text-white/50 text-xs">Passez au plan Pro pour continuer</p>
            </div>
            <button onClick={() => navigate('/dashboard/pricing')} className="btn-primary text-sm py-1.5 px-4">
              Upgrader
            </button>
          </div>
        )}

        {/* Generation Status */}
        {videoStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-6 mb-6 text-center ${
              videoStatus === 'completed' ? 'border-green-500/30 bg-green-500/5' :
              videoStatus === 'failed' ? 'border-red-500/30 bg-red-500/5' :
              'border-primary-500/30 bg-primary-500/5'
            }`}
          >
            {videoStatus === 'processing' || videoStatus === 'pending' ? (
              <>
                <Loader2 className="w-10 h-10 text-primary-400 mx-auto mb-3 animate-spin" />
                <p className="text-white font-semibold">Génération en cours...</p>
                <p className="text-white/50 text-sm mt-1">Script IA → Voix off → Images → Montage</p>
              </>
            ) : videoStatus === 'completed' ? (
              <>
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold">Vidéo prête!</p>
                <p className="text-white/50 text-sm mt-1">Redirection vers vos vidéos...</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold">Génération échouée</p>
                <p className="text-white/50 text-sm mt-1">Vérifiez vos clés API dans les paramètres</p>
              </>
            )}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Topic */}
          <div className="glass-card p-6">
            <label className="flex items-center gap-2 text-white font-semibold mb-4">
              <Brain className="w-4 h-4 text-primary-400" /> Sujet de la vidéo
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ex: Comment gagner de l'argent avec les réseaux sociaux, Les 5 secrets de la réussite, Actualités crypto..."
              rows={3}
              className="input-field resize-none"
            />
            <p className="text-white/30 text-xs mt-2">{topic.length}/200 caractères</p>
          </div>

          {/* Style */}
          <div className="glass-card p-6">
            <label className="flex items-center gap-2 text-white font-semibold mb-4">
              <Sparkles className="w-4 h-4 text-purple-400" /> Style de vidéo
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-xl text-center transition-all border ${
                    style === s.id
                      ? 'border-primary-500/50 bg-primary-500/20 text-white'
                      : 'border-white/5 bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="text-xs font-medium">{s.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language & Voice */}
          <div className="glass-card p-6">
            <label className="flex items-center gap-2 text-white font-semibold mb-4">
              <Mic2 className="w-4 h-4 text-blue-400" /> Langue & Voix
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-white/50 text-xs mb-2 block">Langue</label>
                <select
                  value={language}
                  onChange={e => { setLanguage(e.target.value); setVoiceName('') }}
                  className="input-field"
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇺🇸 Anglais</option>
                  <option value="es">🇪🇸 Espagnol</option>
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-2 block">Voix IA</label>
                <select value={voiceName} onChange={e => setVoiceName(e.target.value)} className="input-field">
                  {voices.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                  {voices.length === 0 && <option value="fr-FR-DeniseNeural">Denise (FR)</option>}
                </select>
              </div>
            </div>
          </div>

          {/* Resolution */}
          <div className="glass-card p-6">
            <label className="flex items-center gap-2 text-white font-semibold mb-4">
              <Image className="w-4 h-4 text-orange-400" /> Format vidéo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {resolutions.map(r => (
                <button
                  key={r.id}
                  onClick={() => setResolution(r.id)}
                  className={`p-3 rounded-xl text-center transition-all border ${
                    resolution === r.id
                      ? 'border-primary-500/50 bg-primary-500/20'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className="text-white text-xs font-medium">{r.label}</div>
                  <div className="text-white/40 text-xs">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !!generatedVideoId || atLimit || !topic.trim()}
            className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Démarrage...</>
            ) : (
              <><Zap className="w-5 h-5" /> Générer la vidéo</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
