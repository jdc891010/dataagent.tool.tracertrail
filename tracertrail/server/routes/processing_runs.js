import express from 'express';
import db from '../database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessingRun:
 *       type: object
 *       required:
 *         - data_source_id
 *         - started_at
 *       properties:
 *         id:
 *           type: string
 *         data_source_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, failed, stopped]
 *         started_at:
 *           type: string
 *           format: date-time
 *         finished_at:
 *           type: string
 *           format: date-time
 *         duration_ms:
 *           type: integer
 *         records_processed:
 *           type: integer
 *         records_failed:
 *           type: integer
 */

/**
 * @swagger
 * /api/processing-runs:
 *   get:
 *     summary: Returns the list of processing runs
 *     tags: [ProcessingRuns]
 *     parameters:
 *       - in: query
 *         name: data_source_id
 *         schema:
 *           type: string
 *         description: Filter by data source ID
 *     responses:
 *       200:
 *         description: The list of processing runs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProcessingRun'
 *             example:
 *               - id: "run_123"
 *                 data_source_id: "src_sfdc_001"
 *                 status: "completed"
 *                 started_at: "2024-03-10T08:00:00Z"
 *                 finished_at: "2024-03-10T08:42:00Z"
 *                 duration_ms: 2520000
 *                 records_processed: 15420
 *                 records_failed: 0
 *               - id: "run_456"
 *                 data_source_id: "src_event_002"
 *                 status: "in_progress"
 *                 started_at: "2024-03-12T10:30:00Z"
 *                 duration_ms: 0
 *                 records_processed: 500
 *                 records_failed: 0
 */
router.get('/', (req, res) => {
  let sql = "SELECT * FROM processing_runs";
  let params = [];
  const filters = [];
  
  // Known columns for SQL filtering
  const knownColumns = ['id', 'data_source_id', 'status'];
  
  knownColumns.forEach(col => {
    if (req.query[col]) {
      filters.push(`${col} = ?`);
      params.push(req.query[col]);
    }
  });

  if (filters.length > 0) {
    sql += " WHERE " + filters.join(" AND ");
  }

  // Default sort by started_at desc if not specified
  if (!req.query.sort) {
      sql += " ORDER BY started_at DESC";
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let items = rows.map(row => {
      const { metadata, ...rest } = row;
      return { ...rest, ...(metadata ? JSON.parse(metadata) : {}) };
    });

    // Filter by remaining query params (metadata fields)
    Object.keys(req.query).forEach(key => {
      if (!knownColumns.includes(key) && key !== 'sort' && key !== 'limit') {
        items = items.filter(item => String(item[key]) === String(req.query[key]));
      }
    });

    // Handle explicit sorting override
    if (req.query.sort) {
        const field = req.query.sort.replace('-', '');
        const desc = req.query.sort.startsWith('-');
        items.sort((a, b) => {
            const valA = a[field] || '';
            const valB = b[field] || '';
            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            return 0;
        });
    }

    res.json(items);
  });
});

/**
 * @swagger
 * /api/processing-runs:
 *   post:
 *     summary: Log a new processing run
 *     tags: [ProcessingRuns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessingRun'
 *     responses:
 *       200:
 *         description: The created processing run
 */
router.post('/', (req, res) => {
  const { data_source_id, status, started_at, finished_at, duration_ms, records_processed, records_failed, id, ...rest } = req.body;
  const newId = id || Math.random().toString(36).substr(2, 9);
  const createdDate = new Date().toISOString();
  
  const sql = `INSERT INTO processing_runs (id, data_source_id, status, started_at, finished_at, duration_ms, records_processed, records_failed, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
      newId, 
      data_source_id, 
      status || 'pending', 
      started_at || createdDate, 
      finished_at, 
      duration_ms || 0, 
      records_processed || 0, 
      records_failed || 0, 
      createdDate, 
      createdDate, 
      JSON.stringify(rest)
  ];
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
        id: newId, 
        data_source_id, 
        status: status || 'pending', 
        started_at: started_at || createdDate, 
        finished_at, 
        duration_ms: duration_ms || 0, 
        records_processed: records_processed || 0, 
        records_failed: records_failed || 0, 
        created_date: createdDate, 
        updated_date: createdDate, 
        ...rest 
    });
  });
});

router.put('/:id', (req, res) => {
    const { status, finished_at, duration_ms, records_processed, records_failed, ...rest } = req.body;
    const updatedDate = new Date().toISOString();

    db.get("SELECT metadata FROM processing_runs WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Processing run not found" });

        let currentMetadata = {};
        if (row.metadata) {
            try {
                currentMetadata = JSON.parse(row.metadata);
            } catch (e) {
                console.error("Error parsing metadata", e);
            }
        }

        const newMetadata = { ...currentMetadata, ...rest };

        // Construct dynamic update query
        let updates = [];
        let params = [];
        
        if (status !== undefined) { updates.push("status = ?"); params.push(status); }
        if (finished_at !== undefined) { updates.push("finished_at = ?"); params.push(finished_at); }
        if (duration_ms !== undefined) { updates.push("duration_ms = ?"); params.push(duration_ms); }
        if (records_processed !== undefined) { updates.push("records_processed = ?"); params.push(records_processed); }
        if (records_failed !== undefined) { updates.push("records_failed = ?"); params.push(records_failed); }
        
        updates.push("updated_date = ?"); params.push(updatedDate);
        updates.push("metadata = ?"); params.push(JSON.stringify(newMetadata));
        
        params.push(req.params.id);

        db.run(`UPDATE processing_runs SET ${updates.join(", ")} WHERE id = ?`,
            params,
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: req.params.id });
            }
        );
    });
});

export default router;
