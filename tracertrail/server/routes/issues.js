import express from 'express';
import db from '../database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Issue:
 *       type: object
 *       required:
 *         - title
 *         - data_source_id
 *       properties:
 *         id:
 *           type: string
 *         data_source_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         issue_type:
 *           type: string
 *         project:
 *           type: string
 *         dataset:
 *           type: string
 *         file:
 *           type: string
 *         assigned_to:
 *           type: string
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved]
 *         created_date:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Returns the list of all issues
 *     tags: [Issues]
 *     responses:
 *       200:
 *         description: The list of issues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Issue'
 *             example:
 *               - id: "issue_001"
 *                 title: "Null values in Email field"
 *                 description: "Significant number of records coming from CRM have null email addresses despite it being a required field."
 *                 issue_type: "completeness"
 *                 severity: "high"
 *                 status: "open"
 *                 project: "Customer 360"
 *                 dataset: "CRM Contacts"
 *                 file: "SFDC Contacts API"
 *                 assigned_to: "Mike Ross"
 *                 created_date: "2024-03-12T08:30:00Z"
 *                 tags: ["data-quality", "critical"]
 *               - id: "issue_002"
 *                 title: "Duplicate Event IDs"
 *                 description: "Found duplicate event IDs in the clickstream data causing inaccurate session counts."
 *                 issue_type: "uniqueness"
 *                 severity: "medium"
 *                 status: "in_progress"
 *                 project: "Customer 360"
 *                 dataset: "Web Events"
 *                 file: "Event Stream Topic"
 *                 assigned_to: "Sarah Chen"
 *                 created_date: "2024-03-12T09:15:00Z"
 *                 tags: ["deduplication"]
 *               - id: "issue_003"
 *                 title: "Currency Mismatch in Sales Data"
 *                 description: "Q3 Sales CSV contains mixed currency symbols (USD and EUR) in the amount column, causing aggregation errors."
 *                 issue_type: "consistency"
 *                 severity: "critical"
 *                 status: "open"
 *                 project: "Sales Forecast"
 *                 dataset: "Regional Sales"
 *                 file: "Q3 Sales CSV"
 *                 assigned_to: "Lisa Wang"
 *                 created_date: "2024-03-12T11:00:00Z"
 *                 tags: ["finance", "formatting"]
 */

router.get('/', (req, res) => {
  let sql = "SELECT * FROM issues";
  let params = [];
  const filters = [];
  
  // Known columns for SQL filtering
  const knownColumns = ['id', 'data_source_id', 'title', 'status', 'severity'];
  
  knownColumns.forEach(col => {
    if (req.query[col]) {
      filters.push(`${col} = ?`);
      params.push(req.query[col]);
    }
  });

  if (filters.length > 0) {
    sql += " WHERE " + filters.join(" AND ");
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

    // Handle sorting
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
 * /api/issues:
 *   post:
 *     summary: Log a new data quality issue
 *     description: Ideal for logging issues discovered during automated jobs or interactive analysis (SDK).
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Issue'
 *           example:
 *             title: "Unexpected Nulls in Region"
 *             data_source_id: "src_sales_003"
 *             description: "Found 500 records with null Region in Q3 Sales data."
 *             severity: "high"
 *             issue_type: "completeness"
 *     responses:
 *       200:
 *         description: The created issue
 */
router.post('/', (req, res) => {
  const { title, data_source_id, description, severity, status, id, ...rest } = req.body;
  const newId = id || Math.random().toString(36).substr(2, 9);
  const createdDate = new Date().toISOString();
  
  const sql = `INSERT INTO issues (id, data_source_id, title, description, severity, status, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [newId, data_source_id, title, description, severity || 'medium', status || 'open', createdDate, createdDate, JSON.stringify(rest)];
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: newId, data_source_id, title, description, severity, status, created_date: createdDate, updated_date: createdDate, ...rest });
  });
});

/**
 * @swagger
 * /api/issues/{id}:
 *   put:
 *     summary: Update an issue status or details
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Issue'
 *           example:
 *             status: "resolved"
 *             description: "Fixed by updating the ingestion pipeline to default nulls to 'Unknown'."
 *     responses:
 *       200:
 *         description: Issue updated
 */
router.put('/:id', (req, res) => {
    const { title, description, severity, status, ...rest } = req.body;
    const updatedDate = new Date().toISOString();

    db.get("SELECT metadata FROM issues WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Issue not found" });

        let currentMetadata = {};
        if (row.metadata) {
            try {
                currentMetadata = JSON.parse(row.metadata);
            } catch (e) {
                console.error("Error parsing metadata", e);
            }
        }

        const newMetadata = { ...currentMetadata, ...rest };

        db.run(`UPDATE issues SET title = COALESCE(?, title), description = COALESCE(?, description), severity = COALESCE(?, severity), status = COALESCE(?, status), updated_date = ?, metadata = ? WHERE id = ?`,
            [title, description, severity, status, updatedDate, JSON.stringify(newMetadata), req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: req.params.id });
            }
        );
    });
});

router.delete('/:id', (req, res) => {
    db.run("DELETE FROM issues WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

export default router;
