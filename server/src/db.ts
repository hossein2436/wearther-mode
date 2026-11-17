import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type DB = DatabaseSync;

export function openDb(file: string): DB {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      trial_start TEXT NOT NULL,
      subscribed_until TEXT
    );
    CREATE TABLE IF NOT EXISTS login_codes (
      email TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS closets (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS push_subs (
      endpoint TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      keys TEXT NOT NULL,
      notify_at TEXT NOT NULL,
      tz TEXT NOT NULL,
      lat REAL,
      lon REAL,
      place TEXT,
      last_sent_date TEXT
    );
    CREATE TABLE IF NOT EXISTS weather_cache (
      cell TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      last_modified TEXT
    );
    CREATE TABLE IF NOT EXISTS geocode_cache (
      q TEXT PRIMARY KEY,
      body TEXT NOT NULL
    );
  `);
  return db;
}
