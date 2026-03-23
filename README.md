# VideoMachine 🎬

**Plateforme SaaS de génération automatique de vidéos par IA**

Transformez n'importe quel sujet en vidéo virale (YouTube Shorts, TikTok, Reels) en moins de 2 minutes.

## Stack Technique

- **Backend**: Python FastAPI + SQLAlchemy + SQLite/PostgreSQL
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion
- **IA**: Claude AI / GPT-4 pour les scripts
- **TTS**: Edge-TTS (50+ voix naturelles)
- **Video**: FFmpeg + Pillow
- **Paiement**: FedaPay (Mobile Money, Orange Money, Wave)
- **Déploiement**: Docker + VPS

## Démarrage Rapide

```bash
# Installation
bash scripts/setup.sh

# Backend (port 8000)
cd backend && source venv/bin/activate
uvicorn main:app --reload

# Frontend (port 3000)
cd frontend && npm run dev
```

## Configuration (backend/.env)

```env
ANTHROPIC_API_KEY=your-key      # Pour génération scripts (Claude)
PEXELS_API_KEY=your-key         # Pour images HD
FEDAPAY_SECRET_KEY=your-key     # Pour paiements
```

## Déploiement VPS

```bash
# Avec Docker
docker-compose up -d

# Script déploiement
bash scripts/deploy.sh
```

## Plans & Tarifs

| Plan | Prix | Vidéos/mois |
|------|------|-------------|
| Gratuit | 0 FCFA | 3 |
| Starter | 5,000 FCFA | 20 |
| Pro | 12,000 FCFA | 100 |
| Enterprise | 30,000 FCFA | Illimité |

## Fonctionnalités

- ✅ Génération script par IA (Claude/GPT-4)
- ✅ Voix off naturelle (50+ voix Edge-TTS)
- ✅ Images auto via Pexels
- ✅ Montage vidéo automatique (FFmpeg)
- ✅ Formats: Portrait (Shorts), Paysage (YouTube), Carré (Instagram)
- ✅ Paiement FedaPay (Mobile Money Afrique)
- ✅ Authentification JWT
- ✅ Dashboard utilisateur
- ✅ Historique & téléchargement vidéos
- ✅ Docker + VPS ready
