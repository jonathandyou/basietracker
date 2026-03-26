const postgres = require('postgres');

const connectionString = process.env.POSTGRES_URL;

let db;

function getDb() {
  if (!db) {
    db = postgres(connectionString, {
      ssl: { rejectUnauthorized: false }
    });
  }
  return db;
}

module.exports = { getDb };
