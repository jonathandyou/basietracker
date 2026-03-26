# 🐱 Basie Tracker

Track your neighborhood cat sightings and feedings!

## Features

- **Track Cat Sightings** - Record when you see a cat, where, and with photos
- **Time Between Sightings** - Automatically calculates how long since the last sighting
- **Photo Uploads** - Upload photos of the cats you spot (stored as base64 in browser)
- **Track Feedings** - Log what and how much you've fed the cats
- **Multiple Cats** - Manage multiple cats at once
- **Export/Import** - Backup your data as JSON

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jonathandyou/basietracker)

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Run Locally

```bash
# Just open index.html in a browser (fully static)
# Or serve with any static server:
npx serve public
```

## Tech Stack

- Pure HTML/CSS/JS (no backend needed)
- localStorage for data persistence
- Photos stored as base64 in browser

## Data Storage

All data is stored locally in your browser using localStorage. Photos are encoded as base64 data URLs. To backup your data, use the Export button in the footer. To transfer data between browsers/devices, export and then import the JSON file.

**Note:** Clearing browser data will erase your tracker data. Always export before clearing browser storage!
