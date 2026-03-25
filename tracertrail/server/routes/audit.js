import express from 'express';
import { getAuditLogs } from '../database.js';

const router = express.Router();

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: List audit logs
 *     description: Returns audit logs for API requests made using API keys
 *     tags: [Audit]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: api_key_id
 *         schema:
 *           type: string
 *         description: Filter by API key ID
 *       - in: query
 *         name: subject_type
 *         schema:
 *           type: string
 *         description: Filter by subject type (project, dataset, issue, etc.)
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *         description: Filter by HTTP method
 *       - in: query
 *         name: status_code
 *         schema:
 *           type: integer
 *         description: Filter by status code
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO 8601)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Max records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   api_key_id:
 *                     type: string
 *                   key_name:
 *                     type: string
 *                   method:
 *                     type: string
 *                   endpoint:
 *                     type: string
 *                   status_code:
 *                     type: integer
 *                   subject_type:
 *                     type: string
 *                   subject_id:
 *                     type: string
 *                   client_ip:
 *                     type: string
 *                   user_agent:
 *                     type: string
 *                   duration_ms:
 *                     type: integer
 *                   created_date:
 *                     type: string
 *                     format: date-time
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      api_key_id: req.query.api_key_id,
      subject_type: req.query.subject_type,
      method: req.query.method,
      status_code: req.query.status_code ? parseInt(req.query.status_code) : null,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const logs = await getAuditLogs(filters);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
