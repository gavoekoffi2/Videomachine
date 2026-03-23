import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Video, Brain, Twitter, Link2, Mail, Zap, Check, ArrowRight, Play, Star, Globe } from 'lucide-react'
import Navbar from '../components/layout/Navbar'

const features = [
  { icon: Video, color: 'from-red-500 to-orange-500', title: 'YouTube Shorts Auto', desc: 'Génère automatiquement des vidéos courtes virales avec IA: topic → script → images → voix → montage → upload YouTube' },
  { icon: Twitter, color: 'from-sky-500 to-blue-600', title: 'Twitter/X Bot', desc: 'Publie automatiquement des tweets générés par IA sur n\'importe quel sujet, avec programmation CRON' },
  { icon: Link2, color: 'from-green-500 to-teal-500', title: 'Affiliate Marketing', desc: 'Scrape les produits Amazon, génère des pitches percutants et les partage automatiquement sur Twitter' },
  { icon: Mail, color: 'from-purple-500 to-pink-500', title: 'Outreach Email', desc: 'Scraping Google Maps + campagnes email automatisées pour trouver des clients potentiels' },
  { icon: Brain, color: 'from-indigo-500 to-purple-600', title: 'IA Locale (Ollama)', desc: 'Utilise des modèles Ollama locaux (Llama, Mistral...) + Gemini pour la génération d\'images IA' },
  { icon: Zap, color: 'from-yellow-500 to-orange-500', title: 'Totalement Automatisé', desc: 'Configurez une fois, laissez tourner en arrière-plan. CRON jobs pour publications automatiques quotidiennes' },
]

const steps = [
  { n: '01', t: 'Configurez Ollama', d: 'Installez Ollama localement, choisissez votre modèle IA (Llama3, Mistral...) et configurez vos API keys dans les Paramètres.' },
  { n: '02', t: 'Choisissez votre niche', d: 'Entrez votre sujet/niche pour YouTube ou Twitter. L\'IA génère tout: topic, script, images, voix off.' },
  { n: '03', t: 'Publiez & monétisez', d: 'Téléchargez votre vidéo ou uploadez directement sur YouTube. Programmez des publications automatiques quotidiennes.' },
]

const plans = [
  { id:'free', name:'Gratuit', xof:0, videos:3, feats:['3 vidéos/mois','YouTube Shorts','Twitter Bot','AFM de base'] },
  { id:'pro', name:'Pro', xof:12000, videos:100, popular:true, feats:['100 vidéos/mois','Toutes fonctionnalités','Support 24/7','CRON illimité'] },
  { id:'enterprise', name:'Enterprise', xof:30000, videos:-1, feats:['Illimité','Tout inclus','Manager dédié','SLA garanti'] },
]

function FadeIn({ children, delay=0, className='' }: any) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref} initial={{ opacity:0, y:25 }} animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.5, delay }} className={className}>
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080817] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 animated-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-sm text-primary-400 mb-8">
              <Zap className="w-3.5 h-3.5" /> Basé sur MoneyPrinterV2 — version SaaS officielle
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Automatisez votre<br /><span className="gradient-text">machine à revenus</span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            className="text-xl text-white/50 max-w-2xl mx-auto mb-10">
            YouTube Shorts, Twitter Bot, Affiliate Marketing & Email Outreach — 100% automatisé par IA locale (Ollama) et Gemini
          </motion.p>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
              Commencer gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="https://github.com/FujiwaraChoki/MoneyPrinterV2" target="_blank" rel="noreferrer"
              className="btn-ghost text-lg px-8 py-4 flex items-center gap-2">
              <Play className="w-4 h-4" /> Voir le projet original
            </a>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            {['✅ Gratuit pour commencer', '✅ Sans carte bancaire', '✅ Mobile Money accepté', '✅ IA locale Ollama'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Tout ce que <span className="gradient-text">MoneyPrinterV2</span> fait
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">La puissance du projet open-source, dans une interface SaaS professionnelle</p>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="glass p-6 hover:border-white/20 transition-all hover:-translate-y-1 group">
                <div className={`w-11 h-11 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white/2">
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Comment <span className="gradient-text">ça marche</span></h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.15} className="text-center">
                <div className="text-6xl font-black gradient-text opacity-20 mb-4">{s.n}</div>
                <h3 className="text-white font-bold text-xl mb-3">{s.t}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.d}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-5xl mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Tarifs <span className="gradient-text">simples</span></h2>
          <p className="text-white/50">Mobile Money, Orange Money, Wave acceptés via FedaPay</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className={`glass p-7 relative flex flex-col ${p.popular ? 'border-primary-500/50' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    POPULAIRE
                  </div>
                )}
                <h3 className="text-white font-bold text-xl mb-3">{p.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-black text-white">{p.xof === 0 ? 'Gratuit' : `${p.xof.toLocaleString()}`}</span>
                  {p.xof > 0 && <span className="text-white/40 text-sm mb-1"> FCFA/mois</span>}
                </div>
                <p className="text-primary-400 text-sm font-medium mb-5">
                  {p.videos === -1 ? '∞ vidéos/mois' : `${p.videos} vidéos/mois`}
                </p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.feats.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-white/60 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={p.popular ? 'btn-primary text-center block' : 'btn-ghost text-center block'}>
                  {p.xof === 0 ? 'Commencer gratuitement' : 'Choisir'}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="glass p-12 bg-gradient-to-br from-primary-500/10 to-purple-600/10 border-primary-500/20">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Prêt à automatiser vos revenus?
              </h2>
              <p className="text-white/50 mb-8">Rejoignez des centaines de créateurs qui utilisent VideoMachine</p>
              <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                Créer mon compte gratuit <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary-500" />
            <span className="text-white font-bold">VideoMachine</span>
            <span className="text-white/20 text-xs ml-2">— Basé sur MoneyPrinterV2</span>
          </div>
          <div className="flex gap-6 text-white/30 text-sm">
            <Link to="/pricing" className="hover:text-white">Tarifs</Link>
            <a href="https://github.com/FujiwaraChoki/MoneyPrinterV2" target="_blank" rel="noreferrer" className="hover:text-white">GitHub Original</a>
            <Link to="/login" className="hover:text-white">Connexion</Link>
          </div>
          <p className="text-white/20 text-sm flex items-center gap-1"><Globe className="w-4 h-4" /> Fait pour l'Afrique</p>
        </div>
      </footer>
    </div>
  )
}
