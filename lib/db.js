const { sql } = require('postgres');

const connectionString = process.env.POSTGRES_URL;

let db;

function getDb() {
  if (!db) {
    db = sql(connectionString);
  }
  return db;
}

module.exports = { getDb };
