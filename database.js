const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'basietracker.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sightings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cat_name TEXT NOT NULL,
    seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    photo_url TEXT,
    time_since_last_seen TEXT
  );

  CREATE TABLE IF NOT EXISTS feedings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cat_name TEXT NOT NULL,
    fed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    food_type TEXT,
    amount TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS cats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
