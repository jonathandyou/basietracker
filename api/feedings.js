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
      CREATE TABLE IF NOT EXISTS feedings (
        id SERIAL PRIMARY KEY,
        cat_name TEXT NOT NULL,
        fed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        food_type TEXT,
        amount TEXT,
        notes TEXT
      )
    `;

    if (req.method === 'GET') {
      const feedings = await db`
        SELECT * FROM feedings 
        ORDER BY fed_at DESC 
        LIMIT 50
      `;
      return res.status(200).json(feedings);
    }

    if (req.method === 'POST') {
      const { cat_name, food_type, amount, notes } = req.body;
      if (!cat_name) return res.status(400).json({ error: 'Cat name is required' });

      const [feeding] = await db`
        INSERT INTO feedings (cat_name, food_type, amount, notes)
        VALUES (${cat_name}, ${food_type || null}, ${amount || null}, ${notes || null})
        RETURNING *
      `;

      return res.status(201).json(feeding);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
