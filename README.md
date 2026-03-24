# VideoMachine SaaS

A full SaaS platform for automated video and content generation, built on top of [MoneyPrinterV2](https://github.com/FujiwaraChoki/MoneyPrinterV2).

## Features

- **YouTube Shorts** — AI-generated scripts, images, voiceover, subtitles, auto-upload
- **TikTok Publisher** — Upload videos to TikTok via the official Content Posting API, AI captions
- **Twitter Bot** — AI-generated posts via Ollama, auto-publish via Selenium
- **Affiliate Marketing (AFM)** — Scrape product info, generate pitch, share on Twitter
- **Email Outreach** — Automated outreach campaigns
- **FedaPay Payments** — Mobile Money, Orange Money, Wave (African market)
- **Freemium** — Free (3 videos), Starter (20/mo), Pro (100/mo), Enterprise (∞)

## Stack

| Layer | Tech |
|-------|------|
| Engine | MoneyPrinterV2 (Ollama, KittenTTS, MoviePy, Selenium) |
| API | FastAPI + SQLAlchemy + SQLite |
| Auth | JWT |
| Payments | FedaPay |
| Frontend | React 18 + TypeScript + Tailwind + Framer Motion |
| Deploy | Docker + nginx  OR  Netlify (frontend) + VPS (backend) |

## Quick Start

### 1. Clone and configure

```bash
git clone <repo-url>
cd Videomachine

# Backend env
cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY, FEDAPAY keys if available

# MoneyPrinterV2 config
cp backend/config.example.json backend/config.json
# Edit backend/config.json — set Ollama server, Gemini key, etc.
```

### 2. Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. First use

1. Register an account at http://localhost/register
2. Go to **Settings** → configure your Ollama server and Gemini API key
3. Go to **YouTube** → enter a niche and generate your first video!

## Requirements (non-Docker)

- Python 3.11+
- Node.js 20+
- Firefox + geckodriver (for Selenium upload)
- Ollama running locally or on a server
- FFmpeg

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT secret key (change in production!) |
| `DATABASE_URL` | SQLite (default) or PostgreSQL URL |
| `ALLOWED_ORIGINS` | CORS origins, comma-separated |
| `FEDAPAY_SECRET_KEY` | FedaPay secret key (optional, demo mode if absent) |
| `FEDAPAY_PUBLIC_KEY` | FedaPay public key |
| `FEDAPAY_ENV` | `sandbox` or `live` |

## MoneyPrinterV2 Config

Configure via the **Settings** page in the dashboard. The config is stored per-user in the database and written to `config.json` before each task. Key settings:

- **Ollama** — URL and model name
- **NanaBanana2/Gemini** — API key for image generation
- **TTS Voice** — Voice ID for KittenTTS
- **Firefox Profile** — Path to Firefox profile for YouTube/Twitter auth
- **Subtitles** — Provider (faster-whisper or AssemblyAI)

## Plans

| Plan | Videos/month | Price |
|------|-------------|-------|
| Free | 3 | 0 FCFA |
| Starter | 20 | 5,000 FCFA |
| Pro | 100 | 15,000 FCFA |
| Enterprise | Unlimited | 40,000 FCFA |

## Deploying Frontend to Netlify

The React frontend can be deployed to Netlify independently. The FastAPI backend must still run on a server (VPS, Railway, Render, etc.).

### Steps

1. Push this repo to GitHub/GitLab.
2. In [Netlify](https://netlify.com): **Add new site → Import from Git**.
3. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add environment variable in Netlify UI:
   - `VITE_API_URL` = `https://your-backend-server.com` (your VPS/Render URL, **no trailing slash**)
5. Make sure your backend has CORS configured to allow the Netlify domain:
   - Set `ALLOWED_ORIGINS=https://your-app.netlify.app` in the backend `.env`
6. Deploy!

The `netlify.toml` at the project root handles all configuration automatically.

## TikTok Setup

1. Create an app on [TikTok for Developers](https://developers.tiktok.com/)
2. Enable the `video.publish` scope
3. Complete OAuth to get an access token
4. Enter the token in **Settings → TikTok** in the dashboard
5. Go to **TikTok** in the sidebar to publish videos

## License

Based on [MoneyPrinterV2](https://github.com/FujiwaraChoki/MoneyPrinterV2) — see original license.
