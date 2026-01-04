import express from 'express';
import db from '../database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Returns the list of all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: The list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *             example:
 *               - id: "proj_123"
 *                 name: "Customer 360"
 *                 description: "Consolidated view of customer data across all touchpoints"
 *                 classification: "internal"
 *                 owner: "Sarah Chen"
 *                 data_steward: "Mike Ross"
 *                 requirements: ["GDPR", "CCPA"]
 *                 tags: ["customer", "analytics", "marketing"]
 *                 created_date: "2024-01-15T10:00:00Z"
 *                 updated_date: "2024-01-20T14:30:00Z"
 *               - id: "proj_456"
 *                 name: "Sales Forecast"
 *                 description: "Quarterly sales prediction models and reporting"
 *                 classification: "confidential"
 *                 owner: "Alex Thompson"
 *                 data_steward: "Lisa Wang"
 *                 requirements: ["SOX"]
 *                 tags: ["finance", "forecasting"]
 *                 created_date: "2024-02-01T09:00:00Z"
 *                 updated_date: "2024-02-05T11:15:00Z"
 */
router.get('/', (req, res) => {
  let sql = "SELECT * FROM projects";
  let params = [];
  const filters = [];
  
  // Known columns for SQL filtering
  const knownColumns = ['id', 'name'];
  
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
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: The created project
 */
router.post('/', (req, res) => {
  const { name, description, id, ...rest } = req.body;
  const projectId = id || Math.random().toString(36).substr(2, 9);
  const createdDate = new Date().toISOString();
  
  const sql = `INSERT INTO projects (id, name, description, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [projectId, name, description, createdDate, createdDate, JSON.stringify(rest)];
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: projectId, name, description, created_date: createdDate, updated_date: createdDate, ...rest });
  });
});

router.put('/:id', (req, res) => {
    const { name, description, ...rest } = req.body;
    const updatedDate = new Date().toISOString();
    
    db.get("SELECT metadata FROM projects WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Project not found" });

        let currentMetadata = {};
        if (row.metadata) {
            try {
                currentMetadata = JSON.parse(row.metadata);
            } catch (e) {
                console.error("Error parsing metadata", e);
            }
        }

        const newMetadata = { ...currentMetadata, ...rest };

        db.run(`UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), updated_date = ?, metadata = ? WHERE id = ?`,
            [name, description, updatedDate, JSON.stringify(newMetadata), req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: req.params.id });
            }
        );
    });
});

router.delete('/:id', (req, res) => {
    db.run("DELETE FROM projects WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

export default router;
