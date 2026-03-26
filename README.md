# 🐱 Basie Tracker

Track your neighborhood cat sightings and feedings!

## Features

- **Track Cat Sightings** - Record when you see a cat, where, and with photos
- **Time Between Sightings** - Automatically calculates how long since the last sighting
- **Photo Uploads** - Upload photos stored as base64 in Neon PostgreSQL
- **Track Feedings** - Log what and how much you've fed the cats
- **Multiple Cats** - Manage multiple cats at once
- **Neon PostgreSQL** - Database hosted on Neon (free tier)

## Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import `jonathandyou/basietracker` from GitHub
3. In **Environment Variables**, add:
   - `POSTGRES_URL` = your Neon connection string (from console.neon.tech)
4. Click **Deploy**

## Local Development

```bash
npm install
npm start
```

Then open http://localhost:3000

**Note:** For local dev with Neon, set the `POSTGRES_URL` environment variable:
```bash
POSTGRES_URL="postgresql://..." npm start
```

## Tech Stack

- **Frontend:** Vanilla JS, HTML, CSS
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Neon PostgreSQL (free tier)

## API Endpoints

- `GET/POST /api/cats` - List or add cats
- `GET/POST /api/sightings` - List or add sightings
- `GET/POST /api/feedings` - List or add feedings
- `GET /api/stats` - Dashboard statistics
