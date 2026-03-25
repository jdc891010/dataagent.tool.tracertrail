import db, { hashToken, getSetting } from '../database.js';

const rateLimitStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

const PUBLIC_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Use: Bearer <token>'
    });
  }

  const token = authHeader.substring(7);
  const tokenHash = hashToken(token);

  try {
    const tokenData = await new Promise((resolve, reject) => {
      db.get(`
        SELECT t.*, k.id as key_id, k.name as key_name, k.rate_limit, k.permissions, k.is_active
        FROM access_tokens t 
        JOIN api_keys k ON t.api_key_id = k.id 
        WHERE t.token_hash = ?
      `, [tokenHash], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!tokenData.is_active) {
      return res.status(401).json({ error: 'API key is disabled' });
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    const rateLimit = tokenData.rate_limit || 100;
    const key = tokenData.key_id;
    
    let rlData = rateLimitStore.get(key);
    const now = Date.now();
    
    if (!rlData || now - rlData.windowStart > 60000) {
      rlData = { windowStart: now, count: 0 };
    }
    
    rlData.count++;
    rateLimitStore.set(key, rlData);
    
    if (rlData.count > rateLimit) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: `Rate limit: ${rateLimit} requests per minute`
      });
    }

    req.auth = {
      apiKeyId: tokenData.key_id,
      keyName: tokenData.key_name,
      permissions: JSON.parse(tokenData.permissions || '{}'),
      tokenId: tokenData.id
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.auth = null;
    return next();
  }

  authenticate(req, res, next);
}

export function requireAuthForMutations(req, res, next) {
  // Development mode: allow all requests without authentication
  // TODO: Change to true in production
  const DEV_MODE = true;
  
  if (DEV_MODE) {
    return next();
  }
  
  if (PUBLIC_METHODS.includes(req.method)) {
    return next();
  }
  return authenticate(req, res, next);
}

export default authenticate;
