import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

// Initialize sql.js
const SQL = await initSqlJs();

// Load existing database or create new one
let db;
if (fs.existsSync(dbPath)) {
  const buffer = fs.readFileSync(dbPath);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

// Helper to save database to file
export const saveDatabase = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = () => {
  db.run(`
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
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      tags TEXT NOT NULL,
      FOREIGN KEY (bar_id) REFERENCES bars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_days (
      event_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      PRIMARY KEY (event_id, day_number),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bars_location ON bars(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_events_bar ON events(bar_id);
    CREATE INDEX IF NOT EXISTS idx_event_days_lookup ON event_days(day_number, event_id);
  `);
  saveDatabase();
};

createTables();

export default db;
