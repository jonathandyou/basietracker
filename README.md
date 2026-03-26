# 🐱 Basie Tracker

Track your neighborhood cat sightings and feedings!

## Features

- **Track Cat Sightings** - Record when you see a cat, where, and with photos
- **Time Between Sightings** - Automatically calculates how long since the last sighting
- **Photo Uploads** - Upload photos of the cats you spot
- **Track Feedings** - Log what and how much you've fed the cats
- **Multiple Cats** - Manage multiple cats at once

## Setup

```bash
# Install dependencies
npm install

# Run the app
npm start
```

Then open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jonathandyou/basietracker)

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Deploy Locally

```bash
git clone https://github.com/jonathandyou/basietracker.git
cd basietracker
npm install
npm start
```

## Tech Stack

- Node.js + Express
- SQLite (file-based, no setup needed)
- Vanilla JS frontend
- Multer for file uploads
