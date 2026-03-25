import express from 'express';
import db, { generateApiKey, hashKey, generateToken, hashToken, getSetting } from '../database.js';

const router = express.Router();

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function calculateExpiry(seconds) {
  if (!seconds || seconds === -1) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         permissions:
 *           type: object
 *         rate_limit:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         last_used_at:
 *           type: string
 *           format: date-time
 *         created_date:
 *           type: string
 *           format: date-time
 *         expires_at:
 *           type: string
 *           format: date-time
 *     TokenResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         token_type:
 *           type: string
 *           default: Bearer
 *         expires_in:
 *           type: integer
 *         expires_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/auth/keys:
 *   get:
 *     summary: List all API keys
 *     description: Returns all API keys for the current user (created from UI)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApiKey'
 */
router.get('/keys', (req, res) => {
  const sql = `SELECT id, name, permissions, rate_limit, is_active, last_used_at, created_date, expires_at 
               FROM api_keys ORDER BY created_date DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const keys = rows.map(row => ({
      ...row,
      is_active: row.is_active === 1
    }));
    res.json(keys);
  });
});

/**
 * @swagger
 * /api/auth/keys:
 *   post:
 *     summary: Create a new API key
 *     description: Creates a new API key. The key is returned only once - store it securely.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Descriptive name for the key
 *               expires_in:
 *                 type: integer
 *                 description: Expiration in seconds (-1 for never, default 2592000 = 30 days)
 *               rate_limit:
 *                 type: integer
 *                 description: Requests per minute (default 100)
 *           example:
 *             name: "Jupyter Notebook"
 *             expires_in: 2592000
 *             rate_limit: 100
 *     responses:
 *       201:
 *         description: API key created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 api_key:
 *                   type: string
 *                   description: The API key - shown only once!
 *                 permissions:
 *                   type: object
 *                 rate_limit:
 *                   type: integer
 *                 created_date:
 *                   type: string
 *                 expires_at:
 *                   type: string
 */
router.post('/keys', async (req, res) => {
  const { name, expires_in, rate_limit } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = generateId();
  const apiKey = generateApiKey();
  const keyHash = hashKey(apiKey);
  const createdDate = new Date().toISOString();
  
  let defaultExpiry = await getSetting('default_key_expiry');
  const expirySeconds = expires_in !== undefined ? parseInt(expires_in) : parseInt(defaultExpiry || '2592000');
  const expiresAt = calculateExpiry(expirySeconds);
  
  const defaultRateLimit = await getSetting('default_rate_limit');
  const limit = rate_limit || parseInt(defaultRateLimit || '100');

  const sql = `INSERT INTO api_keys (id, name, key_hash, permissions, rate_limit, is_active, created_date, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const permissions = { full_access: true };

  db.run(sql, [id, name, keyHash, JSON.stringify(permissions), limit, 1, createdDate, expiresAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id,
      name,
      api_key: apiKey,
      permissions,
      rate_limit: limit,
      created_date: createdDate,
      expires_at: expiresAt
    });
  });
});

/**
 * @swagger
 * /api/auth/keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked
 */
router.delete('/keys/:id', (req, res) => {
  db.run('DELETE FROM api_keys WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'API key not found' });
    res.json({ success: true, message: 'API key revoked' });
  });
});

/**
 * @swagger
 * /api/auth/token/issue:
 *   post:
 *     summary: Exchange API key for access token
 *     description: Use an API key to get an access token for API requests
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               api_key:
 *                 type: string
 *                 description: The API key (sk_xxx)
 *           example:
 *             api_key: "sk_abc123..."
 *     responses:
 *       200:
 *         description: Token issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid or expired API key
 */
router.post('/token/issue', async (req, res) => {
  const { api_key } = req.body;
  
  if (!api_key) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const keyHash = hashKey(api_key);
  
  db.get('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1', [keyHash], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid API key' });
    
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    const defaultExpiry = await getSetting('default_token_expiry');
    const expirySeconds = parseInt(defaultExpiry || '3600');
    const expiresAt = calculateExpiry(expirySeconds);
    const token = generateToken();
    const tokenHash = hashToken(token);
    const tokenId = generateId();
    const createdDate = new Date().toISOString();

    db.run(
      'UPDATE api_keys SET last_used_at = ? WHERE id = ?',
      [createdDate, row.id],
      (err) => {
        if (err) console.error('Error updating last_used_at:', err);
      }
    );

    db.run(
      'INSERT INTO access_tokens (id, api_key_id, token_hash, expires_at, created_date) VALUES (?, ?, ?, ?, ?)',
      [tokenId, row.id, tokenHash, expiresAt, createdDate],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
          access_token: token,
          token_type: 'Bearer',
          expires_in: expirySeconds,
          expires_at: expiresAt
        });
      }
    );
  });
});

/**
 * @swagger
 * /api/auth/token/verify:
 *   post:
 *     summary: Verify an access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is invalid or expired
 */
router.post('/token/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const tokenHash = hashToken(token);
  
  db.get(`
    SELECT t.*, k.name as key_name, k.rate_limit, k.permissions 
    FROM access_tokens t 
    JOIN api_keys k ON t.api_key_id = k.id 
    WHERE t.token_hash = ? AND k.is_active = 1
  `, [tokenHash], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid token' });
    
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    res.json({
      valid: true,
      api_key_id: row.api_key_id,
      key_name: row.key_name,
      permissions: JSON.parse(row.permissions || '{}'),
      expires_at: row.expires_at
    });
  });
});

/**
 * @swagger
 * /api/auth/token/refresh:
 *   post:
 *     summary: Refresh an access token
 *     description: Get a new token using an existing valid token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token issued
 *       401:
 *         description: Invalid or expired token
 */
router.post('/token/refresh', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const tokenHash = hashToken(token);
  
  db.get(`
    SELECT t.*, k.id as key_id 
    FROM access_tokens t 
    JOIN api_keys k ON t.api_key_id = k.id 
    WHERE t.token_hash = ? AND k.is_active = 1
  `, [tokenHash], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid token' });
    
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    const defaultExpiry = await getSetting('default_token_expiry');
    const expirySeconds = parseInt(defaultExpiry || '3600');
    const expiresAt = calculateExpiry(expirySeconds);
    const newToken = generateToken();
    const newTokenHash = hashToken(newToken);
    const tokenId = generateId();
    const createdDate = new Date().toISOString();

    db.run('DELETE FROM access_tokens WHERE id = ?', [row.id], (err) => {
      if (err) console.error('Error deleting old token:', err);
    });

    db.run(
      'INSERT INTO access_tokens (id, api_key_id, token_hash, expires_at, created_date) VALUES (?, ?, ?, ?, ?)',
      [tokenId, row.key_id, newTokenHash, expiresAt, createdDate],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
          access_token: newToken,
          token_type: 'Bearer',
          expires_in: expirySeconds,
          expires_at: expiresAt
        });
      }
    );
  });
});

/**
 * @swagger
 * /api/auth/settings:
 *   get:
 *     summary: Get authentication settings
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/settings:
 *   put:
 *     summary: Update authentication settings
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               default_rate_limit:
 *                 type: integer
 *               default_token_expiry:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/settings', async (req, res) => {
  const { default_rate_limit, default_token_expiry, default_key_expiry, jupyter_url } = req.body;
  
  try {
    if (default_rate_limit !== undefined) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO settings (key, value, updated_date) VALUES (?, ?, ?)',
          ['default_rate_limit', String(default_rate_limit), new Date().toISOString()],
          (err) => err ? reject(err) : resolve());
      });
    }
    
    if (default_token_expiry !== undefined) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO settings (key, value, updated_date) VALUES (?, ?, ?)',
          ['default_token_expiry', String(default_token_expiry), new Date().toISOString()],
          (err) => err ? reject(err) : resolve());
      });
    }
    
    if (default_key_expiry !== undefined) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO settings (key, value, updated_date) VALUES (?, ?, ?)',
          ['default_key_expiry', String(default_key_expiry), new Date().toISOString()],
          (err) => err ? reject(err) : resolve());
      });
    }
    
    if (jupyter_url !== undefined) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO settings (key, value, updated_date) VALUES (?, ?, ?)',
          ['jupyter_url', jupyter_url, new Date().toISOString()],
          (err) => err ? reject(err) : resolve());
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
