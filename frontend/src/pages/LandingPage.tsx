import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Video, Zap, Brain, Mic2, Image, Music, Scissors,
  Check, ArrowRight, Star, Play, Globe, ChevronDown
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'

const features = [
  { icon: Brain, title: 'IA Script Avancée', desc: 'Génération automatique de scripts captivants par Claude/GPT-4', color: 'from-blue-500 to-cyan-500' },
  { icon: Mic2, title: 'Voix Off IA', desc: '50+ voix naturelles en français, anglais et autres langues', color: 'from-purple-500 to-pink-500' },
  { icon: Image, title: 'Images Auto', desc: 'Recherche et sélection automatique d\'images HD via Pexels', color: 'from-orange-500 to-red-500' },
  { icon: Music, title: 'Musique IA', desc: 'Fond musical adapté automatiquement au style de votre vidéo', color: 'from-green-500 to-teal-500' },
  { icon: Scissors, title: 'Montage Auto', desc: 'Assemblage professionnel en format portrait (Shorts/Reels/TikTok)', color: 'from-pink-500 to-rose-500' },
  { icon: Zap, title: 'Ultra Rapide', desc: 'Vidéo prête en moins de 2 minutes pour tous formats', color: 'from-yellow-500 to-orange-500' },
]

const plans = [
  {
    name: 'Gratuit', price: '0', currency: 'FCFA', period: '/mois',
    videos: '3 vidéos/mois', popular: false,
    features: ['3 vidéos HD/mois', 'Voix IA basique', 'Export MP4', 'Support email'],
  },
  {
    name: 'Pro', price: '12,000', currency: 'FCFA', period: '/mois',
    videos: '100 vidéos/mois', popular: true,
    features: ['100 vidéos Full HD/mois', 'Toutes les voix IA', 'API access', 'Support 24/7', 'Styles avancés'],
  },
  {
    name: 'Enterprise', price: '30,000', currency: 'FCFA', period: '/mois',
    videos: 'Vidéos illimitées', popular: false,
    features: ['Vidéos illimitées', '4K disponible', 'API complète', 'Manager dédié', 'SLA garanti', 'Marque blanche'],
  },
]

const testimonials = [
  { name: 'Kofi Mensah', role: 'Créateur de contenu', text: 'VideoMachine m\'a permis de multiplier ma production par 10. Je crée 20 vidéos par jour maintenant!', stars: 5 },
  { name: 'Aisha Diallo', role: 'Marketing Manager', text: 'L\'IA génère des scripts de qualité professionnelle. Mes vidéos font 10x plus de vues qu\'avant.', stars: 5 },
  { name: 'Jean-Baptiste', role: 'Entrepreneur', text: 'ROI exceptionnel. En 3 mois, mon canal YouTube a explosé grâce à VideoMachine.', stars: 5 },
]

function FadeIn({ children, delay = 0, className = '' }: any) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 animated-gradient">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2 text-sm text-primary-400 mb-8">
              <Zap className="w-4 h-4" />
              <span>Propulsé par Claude AI & GPT-4</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-6"
          >
            Créez des{' '}
            <span className="gradient-text">vidéos virales</span>
            <br />en quelques secondes
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-10"
          >
            VideoMachine génère automatiquement des vidéos professionnelles pour YouTube Shorts, TikTok et Instagram Reels grâce à l'intelligence artificielle.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
              Commencer gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="#features" className="btn-outline text-lg px-8 py-4 flex items-center gap-2">
              <Play className="w-5 h-5" /> Voir une démo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 flex items-center justify-center gap-8 text-white/40 text-sm"
          >
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Gratuit pour commencer</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Sans carte bancaire</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Mobile Money accepté</div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Vidéos créées' },
              { value: '500+', label: 'Créateurs actifs' },
              { value: '2 min', label: 'Temps moyen' },
              { value: '4.9/5', label: 'Note utilisateurs' },
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="section-title mb-4">
              Tout ce dont vous avez <span className="gradient-text">besoin</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Une plateforme complète pour automatiser votre production de contenu vidéo
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="glass-card p-6 hover:border-white/20 transition-all hover:-translate-y-1 group">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white/2">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="section-title mb-4">Comment ça <span className="gradient-text">marche?</span></h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Entrez votre sujet', desc: 'Saisissez votre thème en quelques mots. L\'IA comprend toutes les langues.' },
              { step: '02', title: 'L\'IA génère tout', desc: 'Script, voix off, images, musique — tout est créé automatiquement en moins de 2 minutes.' },
              { step: '03', title: 'Téléchargez & publiez', desc: 'Votre vidéo MP4 prête à poster sur YouTube, TikTok, Instagram.' },
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 0.2}>
                <div className="text-center">
                  <div className="text-6xl font-black gradient-text opacity-30 mb-4">{step.step}</div>
                  <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-white/50">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="section-title mb-4">Tarifs <span className="gradient-text">simples</span></h2>
            <p className="text-white/50 text-lg">Paiement par Mobile Money, Orange Money, Wave et plus</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`glass-card p-8 relative ${plan.popular ? 'border-primary-500/50 glow-primary' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      POPULAIRE
                    </div>
                  )}
                  <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/50 text-sm mb-1">{plan.currency}</span>
                  </div>
                  <p className="text-white/40 text-sm mb-2">{plan.period}</p>
                  <p className="text-primary-400 text-sm font-medium mb-6">{plan.videos}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-white/70 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.price === '0' ? '/register' : '/register'}
                    className={plan.popular ? 'btn-primary w-full block text-center' : 'btn-outline w-full block text-center'}
                  >
                    {plan.price === '0' ? 'Commencer gratuitement' : 'Choisir ce plan'}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white/2">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="section-title mb-4">Ils nous <span className="gradient-text">font confiance</span></h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="glass-card p-6">
                  <div className="flex gap-1 mb-4">
                    {Array(t.stars).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="glass-card p-12 bg-gradient-to-br from-primary-500/10 to-purple-600/10 border-primary-500/20">
              <h2 className="text-4xl font-black text-white mb-4">
                Prêt à créer votre première vidéo?
              </h2>
              <p className="text-white/60 mb-8 text-lg">Rejoignez +500 créateurs qui automatisent leur contenu avec VideoMachine</p>
              <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                Créer mon compte gratuit <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary-500" />
              <span className="text-white font-bold">VideoMachine</span>
            </div>
            <div className="flex items-center gap-6 text-white/40 text-sm">
              <Link to="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
              <Link to="/login" className="hover:text-white transition-colors">Connexion</Link>
              <Link to="/register" className="hover:text-white transition-colors">Inscription</Link>
            </div>
            <p className="text-white/30 text-sm flex items-center gap-1">
              <Globe className="w-4 h-4" /> Fait avec ❤️ pour l'Afrique
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
