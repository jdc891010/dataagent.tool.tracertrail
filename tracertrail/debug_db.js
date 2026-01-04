import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'server/storage/tracertrail.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

db.all("SELECT id, title, length(code_snippet) as code_len FROM vault_solutions", [], (err, rows) => {
  if (err) {
    throw err;
  }
  console.log("Vault Solutions:", rows);
});

db.close();
