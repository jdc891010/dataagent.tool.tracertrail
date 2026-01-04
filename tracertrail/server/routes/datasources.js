import express from 'express';
import db from '../database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DataSource:
 *       type: object
 *       required:
 *         - name
 *         - project_id
 *       properties:
 *         id:
 *           type: string
 *         project_id:
 *           type: string
 *         dataset_id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         source_location:
 *           type: string
 *         target_location:
 *           type: string
 *         status:
 *           type: string
 *         phase:
 *           type: string
 *         records_processed:
 *           type: integer
 *         records_failed:
 *           type: integer
 *         quality_score:
 *           type: integer
 *         last_run_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/datasources:
 *   get:
 *     summary: Returns the list of all data sources
 *     tags: [DataSources]
 *     responses:
 *       200:
 *         description: The list of data sources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DataSource'
 *             example:
 *               - id: "src_sfdc_001"
 *                 name: "SFDC Contacts API"
 *                 dataset_id: "ds_crm_001"
 *                 dataset: "CRM Contacts"
 *                 project: "Customer 360"
 *                 type: "api"
 *                 source_location: "/services/data/v54.0/sobjects/Contact"
 *                 target_location: "warehouse.raw.sfdc_contacts"
 *                 status: "completed"
 *                 phase: "ingestion"
 *                 records_processed: 15420
 *                 records_failed: 0
 *                 quality_score: 98
 *                 last_run_date: "2024-03-10T08:00:00Z"
 *               - id: "src_event_002"
 *                 name: "Event Stream Topic"
 *                 dataset_id: "ds_web_002"
 *                 dataset: "Web Events"
 *                 project: "Customer 360"
 *                 type: "stream"
 *                 source_location: "kafka://events-prod/clickstream"
 *                 target_location: "lake.events.clickstream"
 *                 status: "in_progress"
 *                 phase: "processing"
 *                 records_processed: 2500000
 *                 records_failed: 150
 *                 quality_score: 95
 *                 last_run_date: "2024-03-12T10:30:00Z"
 *               - id: "src_sales_003"
 *                 name: "Q3 Sales CSV"
 *                 dataset_id: "ds_sales_003"
 *                 dataset: "Regional Sales"
 *                 project: "Sales Forecast"
 *                 type: "file"
 *                 source_location: "s3://finance-bucket/sales/2024/q3_final.csv"
 *                 target_location: "warehouse.finance.quarterly_sales"
 *                 status: "alert"
 *                 phase: "validation"
 *                 records_processed: 5000
 *                 records_failed: 42
 *                 quality_score: 85
 *                 last_run_date: "2024-03-11T14:20:00Z"
 */

router.get('/', (req, res) => {
  let sql = "SELECT * FROM data_sources";
  let params = [];
  const filters = [];
  
  // Known columns for SQL filtering
  const knownColumns = ['id', 'project_id', 'name', 'type', 'status'];
  
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
  const { name, project_id, type, status, id, ...rest } = req.body;
  const newId = id || Math.random().toString(36).substr(2, 9);
  const createdDate = new Date().toISOString();
  
  const sql = `INSERT INTO data_sources (id, project_id, name, type, status, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [newId, project_id, name, type, status || 'active', createdDate, createdDate, JSON.stringify(rest)];
  
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: newId, project_id, name, type, status: status || 'active', created_date: createdDate, updated_date: createdDate, ...rest });
  });
});

/**
 * @swagger
 * /api/datasources/{id}:
 *   put:
 *     summary: Update a data source (e.g., status, metrics)
 *     description: Useful for SDK integration to update status, records processed, and quality scores after a job run.
 *     tags: [DataSources]
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
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               records_processed:
 *                 type: integer
 *               quality_score:
 *                 type: integer
 *               last_run_date:
 *                 type: string
 *                 format: date-time
 *           example:
 *             status: "completed"
 *             records_processed: 15500
 *             quality_score: 99
 *             last_run_date: "2024-03-10T09:00:00Z"
 *     responses:
 *       200:
 *         description: Data source updated
 */
router.put('/:id', (req, res) => {
    const { name, type, status, ...rest } = req.body;
    const updatedDate = new Date().toISOString();

    db.get("SELECT metadata FROM data_sources WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "DataSource not found" });

        let currentMetadata = {};
        if (row.metadata) {
            try {
                currentMetadata = JSON.parse(row.metadata);
            } catch (e) {
                console.error("Error parsing metadata", e);
            }
        }

        const newMetadata = { ...currentMetadata, ...rest };

        db.run(`UPDATE data_sources SET name = COALESCE(?, name), type = COALESCE(?, type), status = COALESCE(?, status), updated_date = ?, metadata = ? WHERE id = ?`,
            [name, type, status, updatedDate, JSON.stringify(newMetadata), req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: req.params.id });
            }
        );
    });
});

router.delete('/:id', (req, res) => {
    db.run("DELETE FROM data_sources WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

export default router;
