import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      photo_url TEXT,
      source TEXT DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      bar_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      tags TEXT NOT NULL,
      FOREIGN KEY (bar_id) REFERENCES bars(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bars_location ON bars(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_events_bar ON events(bar_id);
  `);
};

createTables();

export default db;
