const { getDb } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();

  try {
    // Initialize tables
    await db`
      CREATE TABLE IF NOT EXISTS sightings (
        id SERIAL PRIMARY KEY,
        cat_name TEXT NOT NULL,
        seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        photo_url TEXT,
        time_since_last_seen TEXT
      )
    `;

    if (req.method === 'GET') {
      const sightings = await db`
        SELECT * FROM sightings 
        ORDER BY seen_at DESC 
        LIMIT 50
      `;
      return res.status(200).json(sightings);
    }

    if (req.method === 'POST') {
      const { cat_name, notes, photo_url } = req.body;
      if (!cat_name) return res.status(400).json({ error: 'Cat name is required' });

      // Get last sighting for this cat
      const [lastSighting] = await db`
        SELECT seen_at FROM sightings 
        WHERE cat_name = ${cat_name}
        ORDER BY seen_at DESC 
        LIMIT 1
      `;

      let timeSinceLastSeen = null;
      if (lastSighting) {
        const lastTime = new Date(lastSighting.seen_at);
        const now = new Date();
        const diffMs = now - lastTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
          timeSinceLastSeen = `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24} hour${diffHours % 24 !== 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
          timeSinceLastSeen = `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMins % 60} min`;
        } else {
          timeSinceLastSeen = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        }
      }

      const [sighting] = await db`
        INSERT INTO sightings (cat_name, notes, photo_url, time_since_last_seen)
        VALUES (${cat_name}, ${notes || null}, ${photo_url || null}, ${timeSinceLastSeen})
        RETURNING *
      `;

      return res.status(201).json(sighting);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
