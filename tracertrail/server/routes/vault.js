import express from 'express';
import db from '../database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     VaultSolution:
 *       type: object
 *       required:
 *         - title
 *         - code_snippet
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id
 *         title:
 *           type: string
 *           description: The solution title
 *         description:
 *           type: string
 *           description: The solution description
 *         category:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         code_snippet:
 *           type: string
 *         language:
 *           type: string
 *         usage_count:
 *           type: integer
 *         author:
 *           type: string
 *         created_date:
 *           type: string
 *           format: date-time
 *         updated_date:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/vault:
 *   get:
 *     summary: Returns the list of vault solutions
 *     tags: [Vault]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (prefix with - for desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max number of results
 *     responses:
 *       200:
 *         description: The list of solutions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VaultSolution'
 *             example:
 *               - id: "sol_123"
 *                 title: "Standard Email Validation & Normalization"
 *                 description: "Robust SQL pattern to validate email format, handle nulls, and normalize to lowercase."
 *                 category: "Data Quality"
 *                 tags: ["sql", "email", "validation", "normalization"]
 *                 code_snippet: "SELECT id, CASE WHEN email IS NULL THEN 'unknown' ELSE LOWER(email) END as email FROM users"
 *                 language: "sql"
 *                 usage_count: 15
 *                 author: "System"
 *                 created_date: "2024-03-01T10:00:00Z"
 *               - id: "sol_456"
 *                 title: "PySpark Deduplication with Window Functions"
 *                 description: "Remove duplicate records while keeping the most recent entry based on timestamp."
 *                 category: "Transformation"
 *                 tags: ["python", "pyspark", "dedup", "window-functions"]
 *                 code_snippet: "window = Window.partitionBy('id').orderBy(col('ts').desc())\ndf.withColumn('rn', row_number().over(window)).filter('rn = 1').drop('rn')"
 *                 language: "python"
 *                 usage_count: 8
 *                 author: "System"
 *                 created_date: "2024-03-05T14:30:00Z"
 */
router.get('/', (req, res) => {
  const { sort, limit, ...filters } = req.query;
  
  let query = 'SELECT * FROM vault_solutions';
  let params = [];
  let whereClauses = [];

  // Handle filters
  Object.keys(filters).forEach(key => {
    whereClauses.push(`${key} = ?`);
    params.push(filters[key]);
  });

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;
    // Basic sanitization
    if (/^[a-zA-Z0-9_]+$/.test(field)) {
      query += ` ORDER BY ${field} ${isDesc ? 'DESC' : 'ASC'}`;
    }
  }

  if (limit) {
    query += ` LIMIT ?`;
    params.push(limit);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse JSON fields and map code_snippet to code for frontend compatibility
    const solutions = rows.map(row => ({
      ...row,
      code: row.code_snippet, // Map database field to frontend field name
      tags: row.tags ? JSON.parse(row.tags) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));
    res.json(solutions);
  });
});

/**
 * @swagger
 * /vault:
 *   post:
 *     summary: Create a new vault solution
 *     tags: [Vault]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VaultSolution'
 *     responses:
 *       200:
 *         description: The created solution
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VaultSolution'
 */
router.post('/', (req, res) => {
  const { title, description, category, tags, code, code_snippet, language, usage_count, author, metadata } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();

  // Use code or code_snippet, whichever is provided
  const codeContent = code || code_snippet;

  const sql = `INSERT INTO vault_solutions (id, title, description, category, tags, code_snippet, language, usage_count, author, created_date, updated_date, metadata)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    id, title, description, category,
    JSON.stringify(tags || []),
    codeContent, language, // Map frontend field to database field
    usage_count || 0, author,
    now, now,
    JSON.stringify(metadata || {})
  ];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id,
      title,
      description,
      category,
      tags: tags || [],
      code: codeContent, // Return the field as 'code' for frontend compatibility
      language,
      usage_count: usage_count || 0,
      author,
      created_date: now,
      updated_date: now,
      metadata: metadata || {}
    });
  });
});

/**
 * @swagger
 * /vault/{id}:
 *   put:
 *     summary: Update a vault solution
 *     tags: [Vault]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The solution id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VaultSolution'
 *     responses:
 *       200:
 *         description: The updated solution
 */
router.put('/:id', (req, res) => {
  const { title, description, category, tags, code, code_snippet, language, usage_count, author, metadata } = req.body;
  const now = new Date().toISOString();
  
  // Use code or code_snippet, whichever is provided
  const codeContent = code || code_snippet;

  // First get existing to merge metadata
  db.get('SELECT * FROM vault_solutions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    const existingMetadata = row.metadata ? JSON.parse(row.metadata) : {};
    const mergedMetadata = metadata ? { ...existingMetadata, ...metadata } : existingMetadata;

    const sql = `UPDATE vault_solutions SET
                 title = COALESCE(?, title),
                 description = COALESCE(?, description),
                 category = COALESCE(?, category),
                 tags = COALESCE(?, tags),
                 code_snippet = COALESCE(?, code_snippet),
                 language = COALESCE(?, language),
                 usage_count = COALESCE(?, usage_count),
                 author = COALESCE(?, author),
                 updated_date = ?,
                 metadata = ?
                 WHERE id = ?`;

    const params = [
      title, description, category,
      tags ? JSON.stringify(tags) : null,
      codeContent, language, usage_count, author, // Map frontend field to database field
      now, JSON.stringify(mergedMetadata),
      req.params.id
    ];

    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Return updated object with proper field mapping
      db.get('SELECT * FROM vault_solutions WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({
          ...row,
          code: row.code_snippet, // Map database field to frontend field name
          tags: JSON.parse(row.tags),
          metadata: JSON.parse(row.metadata)
        });
      });
    });
  });
});

/**
 * @swagger
 * /vault/{id}:
 *   delete:
 *     summary: Delete a vault solution
 *     tags: [Vault]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The solution id
 *     responses:
 *       200:
 *         description: The solution was deleted
 */
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM vault_solutions WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
});

export default router;
