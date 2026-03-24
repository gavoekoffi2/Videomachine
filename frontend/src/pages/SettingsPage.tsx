import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle, Brain, Globe, Mic2, Video, Mail, Music2, Share2 } from 'lucide-react'
import { configApi } from '../lib/api'
import toast from 'react-hot-toast'

const TTS_VOICES = ['Jasper','Aria','Jenny','Guy','Denise','Henri','Sonia','Ryan']

const Section = ({ title, icon: Icon, color, children }: any) => (
  <div className="glass p-6">
    <h3 className="text-white font-bold mb-5 flex items-center gap-2">
      <div className={`w-7 h-7 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
)

const Field = ({ label, children, hint }: { label: string, children: React.ReactNode, hint?: string }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint && <p className="text-white/25 text-xs mt-1">{hint}</p>}
  </div>
)

export default function SettingsPage() {
  const [cfg, setCfg] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['config'], queryFn: () => configApi.get() })

  useEffect(() => {
    if (data?.data) setCfg(data.data)
  }, [data])

  const set = (k: string, v: any) => setCfg((c: any) => ({ ...c, [k]: v }))
  const setEmail = (k: string, v: any) => setCfg((c: any) => ({ ...c, email: { ...(c.email||{}), [k]: v } }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...cfg, email_smtp_server: cfg.email?.smtp_server || 'smtp.gmail.com',
        email_smtp_port: cfg.email?.smtp_port || 587, email_username: cfg.email?.username || '',
        email_password: cfg.email?.password || '' }
      delete payload.email
      await configApi.save(payload)
      toast.success('Configuration sauvegardée!')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur') }
    finally { setSaving(false) }
  }

  const fetchModels = async () => {
    setLoadingModels(true)
    try {
      const r = await configApi.ollamaModels()
      if (r.data.models?.length) { setModels(r.data.models); toast.success(`${r.data.models.length} modèle(s) trouvé(s)`) }
      else { toast.error(r.data.error || 'Aucun modèle Ollama trouvé'); setModels([]) }
    } catch { toast.error('Impossible de joindre Ollama') }
    finally { setLoadingModels(false) }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Paramètres</h1>
              <p className="text-white/40 text-sm">Configuration MoneyPrinterV2</p>
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        <div className="glass p-4 mb-5 bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/60 text-sm">
              <strong className="text-white">Important:</strong> Ollama doit être installé localement et un modèle doit être téléchargé
              (<code className="text-yellow-400">ollama pull llama3.2:3b</code>). Pour les images IA, une clé Gemini est nécessaire.
              Firefox doit être configuré avec un profil connecté à YouTube/Twitter.
            </p>
          </div>
        </div>

        <Section title="IA — Ollama (LLM Local)" icon={Brain} color="from-indigo-500 to-purple-600">
          <Field label="URL serveur Ollama" hint="Ex: http://127.0.0.1:11434 (défaut local)">
            <input value={cfg.ollama_base_url || ''} onChange={e => set('ollama_base_url', e.target.value)} className="input" />
          </Field>
          <Field label="Modèle Ollama">
            <div className="flex gap-2">
              <select value={cfg.ollama_model || ''} onChange={e => set('ollama_model', e.target.value)} className="input flex-1">
                <option value="">-- Sélectionnez un modèle --</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
                {cfg.ollama_model && !models.includes(cfg.ollama_model) && <option value={cfg.ollama_model}>{cfg.ollama_model}</option>}
              </select>
              <button onClick={fetchModels} disabled={loadingModels} className="btn-ghost px-3 flex-shrink-0">
                {loadingModels ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Longueur du script (nb de phrases)" hint="Défaut: 4 phrases">
            <input type="number" min={2} max={15} value={cfg.script_sentence_length || 4}
              onChange={e => set('script_sentence_length', parseInt(e.target.value))} className="input" />
          </Field>
        </Section>

        <Section title="Images IA — Gemini (NanaBanana2)" icon={Globe} color="from-blue-500 to-cyan-500">
          <Field label="Clé API Gemini / NanaBanana2" hint="Obtenez une clé sur Google AI Studio">
            <input type="password" value={cfg.nanobanana2_api_key || ''} onChange={e => set('nanobanana2_api_key', e.target.value)}
              placeholder="AIza..." className="input" />
          </Field>
          <Field label="Modèle Gemini">
            <select value={cfg.nanobanana2_model || 'gemini-3.1-flash-image-preview'} onChange={e => set('nanobanana2_model', e.target.value)} className="input">
              <option value="gemini-3.1-flash-image-preview">gemini-3.1-flash-image-preview</option>
              <option value="gemini-2.0-flash-preview">gemini-2.0-flash-preview</option>
            </select>
          </Field>
          <Field label="Format d'image">
            <select value={cfg.nanobanana2_aspect_ratio || '9:16'} onChange={e => set('nanobanana2_aspect_ratio', e.target.value)} className="input">
              <option value="9:16">9:16 (Portrait - Shorts/TikTok)</option>
              <option value="16:9">16:9 (Paysage - YouTube)</option>
              <option value="1:1">1:1 (Carré - Instagram)</option>
            </select>
          </Field>
        </Section>

        <Section title="Voix TTS (KittenTTS)" icon={Mic2} color="from-orange-500 to-red-500">
          <Field label="Voix" hint="KittenTTS - voix locales incluses avec MoneyPrinterV2">
            <select value={cfg.tts_voice || 'Jasper'} onChange={e => set('tts_voice', e.target.value)} className="input">
              {TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Firefox & Selenium" icon={Video} color="from-orange-500 to-yellow-500">
          <Field label="Chemin vers le profil Firefox" hint="Ex: /home/user/.mozilla/firefox/abc123.default (doit être connecté à YouTube & Twitter)">
            <input value={cfg.firefox_profile || ''} onChange={e => set('firefox_profile', e.target.value)}
              placeholder="/home/user/.mozilla/firefox/xxxxxx.default" className="input" />
          </Field>
          <Field label="Mode headless (sans fenêtre)">
            <div className="flex items-center gap-3">
              <button onClick={() => set('headless', true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${cfg.headless ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-white/40'}`}>
                <CheckCircle className="w-3.5 h-3.5" /> Activé (recommandé serveur)
              </button>
              <button onClick={() => set('headless', false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${!cfg.headless ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-white/40'}`}>
                Désactivé (avec fenêtre)
              </button>
            </div>
          </Field>
          <Field label="Chemin ImageMagick" hint="Linux: /usr/bin/convert — Windows: C:\\Program Files\\ImageMagick...\\magick.exe">
            <input value={cfg.imagemagick_path || '/usr/bin/convert'} onChange={e => set('imagemagick_path', e.target.value)} className="input" />
          </Field>
          <Field label="Threads (CPU)" hint="Nombre de threads pour MoviePy (défaut: 2)">
            <input type="number" min={1} max={16} value={cfg.threads || 2} onChange={e => set('threads', parseInt(e.target.value))} className="input" />
          </Field>
        </Section>

        <Section title="TikTok" icon={Music2} color="from-pink-500 to-red-500">
          <Field label="Access Token TikTok" hint="Obtenez-le via TikTok for Developers → votre app → scope video.publish">
            <input type="password" value={cfg.tiktok_access_token || ''} onChange={e => set('tiktok_access_token', e.target.value)} placeholder="Votre access token TikTok" className="input" />
          </Field>
          <Field label="Confidentialité par défaut">
            <select value={cfg.tiktok_default_privacy || 'PUBLIC_TO_EVERYONE'} onChange={e => set('tiktok_default_privacy', e.target.value)} className="input">
              <option value="PUBLIC_TO_EVERYONE">Public</option>
              <option value="FOLLOWER_OF_CREATOR">Abonnés seulement</option>
              <option value="SELF_ONLY">Privé (moi)</option>
            </select>
          </Field>
        </Section>

        <Section title="Twitter & Sous-titres" icon={Settings} color="from-sky-500 to-blue-600">
          <Field label="Langue Twitter (pour génération tweets)">
            <select value={cfg.twitter_language || 'French'} onChange={e => set('twitter_language', e.target.value)} className="input">
              {['French','English','Spanish','Portuguese','Arabic'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Provider STT (sous-titres)">
            <select value={cfg.stt_provider || 'local_whisper'} onChange={e => set('stt_provider', e.target.value)} className="input">
              <option value="local_whisper">Local Whisper (gratuit)</option>
              <option value="third_party_assemblyai">AssemblyAI (API)</option>
            </select>
          </Field>
          {cfg.stt_provider === 'third_party_assemblyai' && (
            <Field label="Clé API AssemblyAI">
              <input type="password" value={cfg.assembly_ai_api_key || ''} onChange={e => set('assembly_ai_api_key', e.target.value)} placeholder="Votre clé AssemblyAI" className="input" />
            </Field>
          )}
          <Field label="Modèle Whisper" hint="tiny, base, small, medium, large">
            <input value={cfg.whisper_model || 'base'} onChange={e => set('whisper_model', e.target.value)} className="input" />
          </Field>
        </Section>

        <Section title="Social Media (Facebook · Instagram · LinkedIn)" icon={Share2} color="from-blue-500 to-pink-500">
          <div className="glass p-3 bg-blue-500/5 border-blue-500/20 -mt-1 mb-2">
            <p className="text-white/50 text-xs">
              Exportez vos cookies de navigateur au format JSON (extension <strong className="text-white">EditThisCookie</strong> ou similaire)
              depuis un navigateur connecté à chaque plateforme, puis collez-les ci-dessous.
            </p>
          </div>
          <Field label="Cookies Facebook (JSON)" hint='Ex: [{"name":"c_user","value":"...","domain":".facebook.com",...}]'>
            <textarea rows={3} value={cfg.facebook_cookies || ''} onChange={e => set('facebook_cookies', e.target.value)}
              placeholder='[{"name":"c_user","value":"..."}]'
              className="input font-mono text-xs resize-none" />
          </Field>
          <Field label="Cookies Instagram (JSON)" hint="Même format — connecté à instagram.com">
            <textarea rows={3} value={cfg.instagram_cookies || ''} onChange={e => set('instagram_cookies', e.target.value)}
              placeholder='[{"name":"sessionid","value":"..."}]'
              className="input font-mono text-xs resize-none" />
          </Field>
          <Field label="Cookies LinkedIn (JSON)" hint="Même format — connecté à linkedin.com">
            <textarea rows={3} value={cfg.linkedin_cookies || ''} onChange={e => set('linkedin_cookies', e.target.value)}
              placeholder='[{"name":"li_at","value":"..."}]'
              className="input font-mono text-xs resize-none" />
          </Field>
        </Section>

        <Section title="Email Outreach" icon={Mail} color="from-pink-500 to-rose-500">
          <Field label="Serveur SMTP"><input value={cfg.email?.smtp_server || 'smtp.gmail.com'} onChange={e => setEmail('smtp_server', e.target.value)} className="input" /></Field>
          <Field label="Port SMTP"><input type="number" value={cfg.email?.smtp_port || 587} onChange={e => setEmail('smtp_port', parseInt(e.target.value))} className="input" /></Field>
          <Field label="Email"><input type="email" value={cfg.email?.username || ''} onChange={e => setEmail('username', e.target.value)} placeholder="votre@gmail.com" className="input" /></Field>
          <Field label="Mot de passe app" hint="Utilisez un mot de passe d'application Gmail (pas votre mot de passe principal)">
            <input type="password" value={cfg.email?.password || ''} onChange={e => setEmail('password', e.target.value)} className="input" />
          </Field>
          <Field label="Niche Google Maps (pour prospection)">
            <input value={cfg.google_maps_scraper_niche || ''} onChange={e => set('google_maps_scraper_niche', e.target.value)} placeholder="Ex: restaurant, médecin, avocat..." className="input" />
          </Field>
        </Section>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-8">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
