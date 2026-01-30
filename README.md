# Stewie AI Terminal - Next.js

Intelligent Kubernetes infrastructure assistant with voice control and real-time monitoring.

## Features

- 🧠 Intelligent cluster monitoring & analysis
- 🎤 Voice control with speech recognition
- 🗣️ Premium ElevenLabs voice (with browser fallback)
- 🎭 Multiple personality modes (professional, helpful, funny, auto)
- 🌍 Multilingual support
- 💾 Conversation memory
- 📊 Real-time health scoring

## Quick Start

### 1. Install dependencies

```bash
cd stewie-nextjs
npm install
```

### 2. Configure API URL

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://35.212.144.149:5001
```

Or for production, set your backend URL.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL=your-backend-url`
4. Deploy!

## Deploy to Netlify

1. Push to GitHub
2. Import to Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Set environment variable: `NEXT_PUBLIC_API_URL=your-backend-url`

## Backend Setup

Make sure your backend (sim.py) is running and accessible:

```bash
# On your GCP VM
cd ~/friday
python3 sim.py
```

Backend should be accessible at the URL you set in `.env.local`.

## Features

- **Voice Commands**: Click "Voice" button or say commands
- **Personality Modes**: Click "Mode" to cycle through personalities
- **Health Analysis**: Click "Analyze" for cluster health report
- **Stop Speaking**: Click "Stop" to interrupt Stewie

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Web Speech API
- ElevenLabs TTS (optional)
