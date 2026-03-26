const { getDb } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  try {
    const [catsCount] = await db`SELECT COUNT(*) as count FROM cats`;
    const [sightingsCount] = await db`SELECT COUNT(*) as count FROM sightings`;
    const [feedingsCount] = await db`SELECT COUNT(*) as count FROM feedings`;

    const [lastSighting] = await db`
      SELECT * FROM sightings ORDER BY seen_at DESC LIMIT 1
    `;

    const recentFeedings = await db`
      SELECT * FROM feedings ORDER BY fed_at DESC LIMIT 5
    `;

    return res.status(200).json({
      totalCats: parseInt(catsCount.count),
      totalSightings: parseInt(sightingsCount.count),
      totalFeedings: parseInt(feedingsCount.count),
      lastSighting: lastSighting || null,
      recentFeedings: recentFeedings || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
