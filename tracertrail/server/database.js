import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directory exists
import fs from 'fs';
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const sqlite = sqlite3.verbose();
const dbPath = path.resolve(storageDir, 'tracertrail.db');

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeSchema();
  }
});

function initializeSchema() {
  db.serialize(() => {
    // Projects
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON
    )`);

    // DataSources
    db.run(`CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      status TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);

    // Datasets
    db.run(`CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);

    // Issues
    db.run(`CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      data_source_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT,
      severity TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(data_source_id) REFERENCES data_sources(id)
    )`);

    // Vault Solutions
    db.run(`CREATE TABLE IF NOT EXISTS vault_solutions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      tags JSON,
      code_snippet TEXT,
      language TEXT,
      usage_count INTEGER,
      author TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON
    )`);
  });
}

export default db;
