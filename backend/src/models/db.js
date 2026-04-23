const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.sqlite';

let db;

function getDb() {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'agent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      planting_date TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'Planted' CHECK(stage IN ('Planted', 'Growing', 'Ready', 'Harvested')),
      size_hectares REAL,
      location TEXT,
      assigned_agent_id TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS field_updates (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      previous_stage TEXT,
      new_stage TEXT,
      notes TEXT,
      observations TEXT,
      weather_condition TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES users(id)
    );

    CREATE TRIGGER IF NOT EXISTS update_fields_timestamp
    AFTER UPDATE ON fields
    BEGIN
      UPDATE fields SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

module.exports = { getDb };
