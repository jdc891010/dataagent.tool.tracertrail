import express from 'express';
import db from '../database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Dataset:
 *       type: object
 *       required:
 *         - name
 *         - project_id
 *       properties:
 *         id:
 *           type: string
 *         project_id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         source_system:
 *           type: string
 *         type:
 *           type: string
 *         refresh_frequency:
 *           type: string
 *         contains_pii:
 *           type: boolean
 *         data_retention:
 *           type: string
 *         data_steward:
 *           type: string
 *         data_owner:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/datasets:
 *   get:
 *     summary: Returns the list of all datasets
 *     tags: [Datasets]
 *     responses:
 *       200:
 *         description: The list of datasets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dataset'
 *             example:
 *               - id: "ds_crm_001"
 *                 name: "CRM Contacts"
 *                 description: "Raw contact data from Salesforce"
 *                 project_id: "proj_123"
 *                 project: "Customer 360"
 *                 source_system: "Salesforce"
 *                 type: "api"
 *                 refresh_frequency: "daily"
 *                 contains_pii: true
 *                 data_retention: "7 years"
 *                 data_steward: "Mike Ross"
 *                 data_owner: "Sarah Chen"
 *                 tags: ["raw", "crm"]
 *                 created_date: "2024-01-15T11:00:00Z"
 *               - id: "ds_web_002"
 *                 name: "Web Events"
 *                 description: "Clickstream data from website"
 *                 project_id: "proj_123"
 *                 project: "Customer 360"
 *                 source_system: "Segment"
 *                 type: "stream"
 *                 refresh_frequency: "real-time"
 *                 contains_pii: false
 *                 data_retention: "1 year"
 *                 data_steward: "Mike Ross"
 *                 data_owner: "Sarah Chen"
 *                 tags: ["events", "clickstream"]
 *                 created_date: "2024-01-16T09:30:00Z"
 *               - id: "ds_sales_003"
 *                 name: "Regional Sales"
 *                 description: "Aggregated sales numbers by region"
 *                 project_id: "proj_456"
 *                 project: "Sales Forecast"
 *                 source_system: "Snowflake"
 *                 type: "warehouse"
 *                 refresh_frequency: "weekly"
 *                 contains_pii: false
 *                 data_retention: "10 years"
 *                 data_steward: "Lisa Wang"
 *                 data_owner: "Alex Thompson"
 *                 tags: ["aggregated", "finance"]
 *                 created_date: "2024-02-02T14:15:00Z"
 */
router.get('/', (req, res) => {
  let sql = "SELECT * FROM datasets";
  let params = [];
  const filters = [];
  
  // Known columns for SQL filtering
  const knownColumns = ['id', 'project_id', 'name'];
  
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

router.post('/', (req, res) => {
  const { name, project_id, description, id, ...rest } = req.body;
  const newId = id || Math.random().toString(36).substr(2, 9);
  const createdDate = new Date().toISOString();
  
  const sql = `INSERT INTO datasets (id, project_id, name, description, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [newId, project_id, name, description, createdDate, createdDate, JSON.stringify(rest)];
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: newId, project_id, name, description, created_date: createdDate, updated_date: createdDate, ...rest });
  });
});

router.put('/:id', (req, res) => {
    const { name, description, ...rest } = req.body;
    const updatedDate = new Date().toISOString();

    db.get("SELECT metadata FROM datasets WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Dataset not found" });

        let currentMetadata = {};
        if (row.metadata) {
            try {
                currentMetadata = JSON.parse(row.metadata);
            } catch (e) {
                console.error("Error parsing metadata", e);
            }
        }

        const newMetadata = { ...currentMetadata, ...rest };

        db.run(`UPDATE datasets SET name = COALESCE(?, name), description = COALESCE(?, description), updated_date = ?, metadata = ? WHERE id = ?`,
            [name, description, updatedDate, JSON.stringify(newMetadata), req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: req.params.id });
            }
        );
    });
});

router.delete('/:id', (req, res) => {
    db.run("DELETE FROM datasets WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

export default router;
