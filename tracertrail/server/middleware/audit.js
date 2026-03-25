import { createAuditLog } from '../database.js';

const SUBJECT_ROUTES = {
  'projects': 'project',
  'datasets': 'dataset',
  'datasources': 'datasource',
  'issues': 'issue',
  'vault': 'vault',
  'processing-runs': 'processing_run',
  'auth': 'api_key',
  'audit-logs': 'audit_log'
};

function extractSubject(path, method) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { subject_type: null, subject_id: null };
  
  const routeName = parts[0];
  const subjectType = SUBJECT_ROUTES[routeName] || routeName;
  
  let subjectId = null;
  if (parts.length > 1) {
    const potentialId = parts[1];
    if (potentialId && !['list', 'filter', 'create'].includes(potentialId)) {
      subjectId = potentialId;
    }
  }
  
  return { subject_type: subjectType, subject_id: subjectId };
}

export function auditMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    if (statusCode >= 200 && statusCode < 500) {
      const apiKeyId = req.auth?.apiKeyId || null;
      const keyName = req.auth?.keyName || 'anonymous';
      
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
        || req.socket?.remoteAddress 
        || 'unknown';
      
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      const { subject_type, subject_id } = extractSubject(req.path, req.method);
      
      const logEntry = {
        api_key_id: apiKeyId,
        key_name: keyName,
        method: req.method,
        endpoint: req.path,
        status_code: statusCode,
        subject_type: subject_type,
        subject_id: subject_id,
        client_ip: clientIp,
        user_agent: userAgent,
        duration_ms: durationMs
      };
      
      createAuditLog(logEntry).catch(err => {
        console.error('[Audit] Failed to log request:', err.message);
      });
    }
  };
  
  next();
}

export default auditMiddleware;
