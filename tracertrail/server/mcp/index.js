import db from '../database.js';

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function buildResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function buildError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

const tools = {
  
  // Projects
  projects_list: {
    name: 'projects_list',
    description: 'List all projects with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Filter by project ID' },
        name: { type: 'string', description: 'Filter by project name' },
        limit: { type: 'number', description: 'Limit number of results' }
      }
    },
    fn: async (args) => {
      let sql = 'SELECT * FROM projects';
      const params = [];
      const filters = [];
      
      if (args.id) { filters.push('id = ?'); params.push(args.id); }
      if (args.name) { filters.push('name = ?'); params.push(args.name); }
      
      if (filters.length > 0) sql += ' WHERE ' + filters.join(' AND ');
      sql += ' ORDER BY created_date DESC';
      
      if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }
      
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => {
            const { metadata, ...rest } = row;
            return { ...rest, ...(metadata ? JSON.parse(metadata) : {}) };
          }));
        });
      });
    }
  },
  
  projects_get: {
    name: 'projects_get',
    description: 'Get a single project by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM projects WHERE id = ?', [args.id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const { metadata, ...rest } = row;
            resolve({ ...rest, ...(metadata ? JSON.parse(metadata) : {}) });
          }
        });
      });
    }
  },
  
  projects_create: {
    name: 'projects_create',
    description: 'Create a new project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['name']
    },
    fn: async (args) => {
      const id = args.id || generateId();
      const createdDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO projects (id, name, description, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?)',
          [id, args.name, args.description || '', createdDate, createdDate, JSON.stringify(args.metadata || {})],
          function(err) {
            if (err) reject(err);
            else resolve({ id, name: args.name, description: args.description, created_date: createdDate });
          }
        );
      });
    }
  },
  
  projects_update: {
    name: 'projects_update',
    description: 'Update an existing project',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project ID' },
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['id']
    },
    fn: async (args) => {
      const id = args.id;
      const updatedDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.get('SELECT metadata FROM projects WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const currentMetadata = row.metadata ? JSON.parse(row.metadata) : {};
            const newMetadata = { ...currentMetadata, ...(args.metadata || {}) };
            
            db.run(
              'UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), updated_date = ?, metadata = ? WHERE id = ?',
              [args.name, args.description, updatedDate, JSON.stringify(newMetadata), id],
              function(err) {
                if (err) reject(err);
                else resolve({ success: true, id });
              }
            );
          }
        });
      });
    }
  },
  
  projects_delete: {
    name: 'projects_delete',
    description: 'Delete a project',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM projects WHERE id = ?', [args.id], function(err) {
          if (err) reject(err);
          else resolve({ success: true, deleted: this.changes });
        });
      });
    }
  },

  // Datasets
  datasets_list: {
    name: 'datasets_list',
    description: 'List all datasets with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Filter by project ID' },
        id: { type: 'string', description: 'Filter by dataset ID' },
        name: { type: 'string', description: 'Filter by name' },
        limit: { type: 'number', description: 'Limit number of results' }
      }
    },
    fn: async (args) => {
      let sql = 'SELECT * FROM datasets';
      const params = [];
      const filters = [];
      
      if (args.project_id) { filters.push('project_id = ?'); params.push(args.project_id); }
      if (args.id) { filters.push('id = ?'); params.push(args.id); }
      if (args.name) { filters.push('name = ?'); params.push(args.name); }
      
      if (filters.length > 0) sql += ' WHERE ' + filters.join(' AND ');
      sql += ' ORDER BY created_date DESC';
      
      if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }
      
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => {
            const { metadata, ...rest } = row;
            return { ...rest, ...(metadata ? JSON.parse(metadata) : {}) };
          }));
        });
      });
    }
  },
  
  datasets_get: {
    name: 'datasets_get',
    description: 'Get a single dataset by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Dataset ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM datasets WHERE id = ?', [args.id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const { metadata, ...rest } = row;
            resolve({ ...rest, ...(metadata ? JSON.parse(metadata) : {}) });
          }
        });
      });
    }
  },
  
  datasets_create: {
    name: 'datasets_create',
    description: 'Create a new dataset',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Dataset name' },
        project_id: { type: 'string', description: 'Project ID' },
        description: { type: 'string', description: 'Dataset description' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['name', 'project_id']
    },
    fn: async (args) => {
      const id = args.id || generateId();
      const createdDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO datasets (id, project_id, name, description, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, args.project_id, args.name, args.description || '', createdDate, createdDate, JSON.stringify(args.metadata || {})],
          function(err) {
            if (err) reject(err);
            else resolve({ id, project_id: args.project_id, name: args.name, description: args.description, created_date: createdDate });
          }
        );
      });
    }
  },
  
  datasets_update: {
    name: 'datasets_update',
    description: 'Update an existing dataset',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Dataset ID' },
        name: { type: 'string', description: 'Dataset name' },
        description: { type: 'string', description: 'Dataset description' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['id']
    },
    fn: async (args) => {
      const id = args.id;
      const updatedDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.get('SELECT metadata FROM datasets WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const currentMetadata = row.metadata ? JSON.parse(row.metadata) : {};
            const newMetadata = { ...currentMetadata, ...(args.metadata || {}) };
            
            db.run(
              'UPDATE datasets SET name = COALESCE(?, name), description = COALESCE(?, description), updated_date = ?, metadata = ? WHERE id = ?',
              [args.name, args.description, updatedDate, JSON.stringify(newMetadata), id],
              function(err) {
                if (err) reject(err);
                else resolve({ success: true, id });
              }
            );
          }
        });
      });
    }
  },
  
  datasets_delete: {
    name: 'datasets_delete',
    description: 'Delete a dataset',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Dataset ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM datasets WHERE id = ?', [args.id], function(err) {
          if (err) reject(err);
          else resolve({ success: true, deleted: this.changes });
        });
      });
    }
  },

  // Data Sources
  datasources_list: {
    name: 'datasources_list',
    description: 'List all data sources with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Filter by project ID' },
        dataset_id: { type: 'string', description: 'Filter by dataset ID' },
        type: { type: 'string', description: 'Filter by type' },
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Limit number of results' }
      }
    },
    fn: async (args) => {
      let sql = 'SELECT * FROM data_sources';
      const params = [];
      const filters = [];
      
      if (args.project_id) { filters.push('project_id = ?'); params.push(args.project_id); }
      if (args.dataset_id) { filters.push('dataset_id = ?'); params.push(args.dataset_id); }
      if (args.type) { filters.push('type = ?'); params.push(args.type); }
      if (args.status) { filters.push('status = ?'); params.push(args.status); }
      
      if (filters.length > 0) sql += ' WHERE ' + filters.join(' AND ');
      sql += ' ORDER BY created_date DESC';
      
      if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }
      
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => {
            const { metadata, ...rest } = row;
            return { ...rest, ...(metadata ? JSON.parse(metadata) : {}) };
          }));
        });
      });
    }
  },
  
  datasources_get: {
    name: 'datasources_get',
    description: 'Get a single data source by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Data source ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM data_sources WHERE id = ?', [args.id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const { metadata, ...rest } = row;
            resolve({ ...rest, ...(metadata ? JSON.parse(metadata) : {}) });
          }
        });
      });
    }
  },
  
  datasources_create: {
    name: 'datasources_create',
    description: 'Create a new data source',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Data source name' },
        project_id: { type: 'string', description: 'Project ID' },
        type: { type: 'string', description: 'Data source type (api, file, stream, database, warehouse)' },
        status: { type: 'string', description: 'Initial status' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['name', 'project_id']
    },
    fn: async (args) => {
      const id = args.id || generateId();
      const createdDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO data_sources (id, project_id, name, type, status, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, args.project_id, args.name, args.type || 'api', args.status || 'active', createdDate, createdDate, JSON.stringify(args.metadata || {})],
          function(err) {
            if (err) reject(err);
            else resolve({ id, project_id: args.project_id, name: args.name, type: args.type, status: args.status, created_date: createdDate });
          }
        );
      });
    }
  },
  
  datasources_update: {
    name: 'datasources_update',
    description: 'Update an existing data source',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Data source ID' },
        name: { type: 'string', description: 'Data source name' },
        type: { type: 'string', description: 'Data source type' },
        status: { type: 'string', description: 'Status' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['id']
    },
    fn: async (args) => {
      const id = args.id;
      const updatedDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.get('SELECT metadata FROM data_sources WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const currentMetadata = row.metadata ? JSON.parse(row.metadata) : {};
            const newMetadata = { ...currentMetadata, ...(args.metadata || {}) };
            
            db.run(
              'UPDATE data_sources SET name = COALESCE(?, name), type = COALESCE(?, type), status = COALESCE(?, status), updated_date = ?, metadata = ? WHERE id = ?',
              [args.name, args.type, args.status, updatedDate, JSON.stringify(newMetadata), id],
              function(err) {
                if (err) reject(err);
                else resolve({ success: true, id });
              }
            );
          }
        });
      });
    }
  },
  
  datasources_delete: {
    name: 'datasources_delete',
    description: 'Delete a data source',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Data source ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM data_sources WHERE id = ?', [args.id], function(err) {
          if (err) reject(err);
          else resolve({ success: true, deleted: this.changes });
        });
      });
    }
  },

  // Issues
  issues_list: {
    name: 'issues_list',
    description: 'List all issues with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        data_source_id: { type: 'string', description: 'Filter by data source ID' },
        status: { type: 'string', description: 'Filter by status (open, in_progress, resolved)' },
        severity: { type: 'string', description: 'Filter by severity (low, medium, high, critical)' },
        limit: { type: 'number', description: 'Limit number of results' }
      }
    },
    fn: async (args) => {
      let sql = 'SELECT * FROM issues';
      const params = [];
      const filters = [];
      
      if (args.data_source_id) { filters.push('data_source_id = ?'); params.push(args.data_source_id); }
      if (args.status) { filters.push('status = ?'); params.push(args.status); }
      if (args.severity) { filters.push('severity = ?'); params.push(args.severity); }
      
      if (filters.length > 0) sql += ' WHERE ' + filters.join(' AND ');
      sql += ' ORDER BY created_date DESC';
      
      if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }
      
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => {
            const { metadata, ...rest } = row;
            return { ...rest, ...(metadata ? JSON.parse(metadata) : {}) };
          }));
        });
      });
    }
  },
  
  issues_get: {
    name: 'issues_get',
    description: 'Get a single issue by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Issue ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM issues WHERE id = ?', [args.id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const { metadata, ...rest } = row;
            resolve({ ...rest, ...(metadata ? JSON.parse(metadata) : {}) });
          }
        });
      });
    }
  },
  
  issues_create: {
    name: 'issues_create',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        data_source_id: { type: 'string', description: 'Related data source ID' },
        severity: { type: 'string', description: 'Severity (low, medium, high, critical)' },
        status: { type: 'string', description: 'Status (open, in_progress, resolved)' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['title']
    },
    fn: async (args) => {
      const id = args.id || generateId();
      const createdDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO issues (id, data_source_id, title, description, severity, status, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, args.data_source_id || null, args.title, args.description || '', args.severity || 'medium', args.status || 'open', createdDate, createdDate, JSON.stringify(args.metadata || {})],
          function(err) {
            if (err) reject(err);
            else resolve({ id, title: args.title, description: args.description, severity: args.severity, status: args.status, created_date: createdDate });
          }
        );
      });
    }
  },
  
  issues_update: {
    name: 'issues_update',
    description: 'Update an existing issue',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Issue ID' },
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        severity: { type: 'string', description: 'Severity' },
        status: { type: 'string', description: 'Status' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['id']
    },
    fn: async (args) => {
      const id = args.id;
      const updatedDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.get('SELECT metadata FROM issues WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const currentMetadata = row.metadata ? JSON.parse(row.metadata) : {};
            const newMetadata = { ...currentMetadata, ...(args.metadata || {}) };
            
            db.run(
              'UPDATE issues SET title = COALESCE(?, title), description = COALESCE(?, description), severity = COALESCE(?, severity), status = COALESCE(?, status), updated_date = ?, metadata = ? WHERE id = ?',
              [args.title, args.description, args.severity, args.status, updatedDate, JSON.stringify(newMetadata), id],
              function(err) {
                if (err) reject(err);
                else resolve({ success: true, id });
              }
            );
          }
        });
      });
    }
  },
  
  issues_resolve: {
    name: 'issues_resolve',
    description: 'Mark an issue as resolved',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Issue ID' },
        resolution: { type: 'string', description: 'Resolution notes' }
      },
      required: ['id']
    },
    fn: async (args) => {
      const id = args.id;
      const updatedDate = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.get('SELECT metadata FROM issues WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const currentMetadata = row.metadata ? JSON.parse(row.metadata) : {};
            const newMetadata = { ...currentMetadata, resolution: args.resolution, resolved_at: updatedDate };
            
            db.run(
              'UPDATE issues SET status = ?, updated_date = ?, metadata = ? WHERE id = ?',
              ['resolved', updatedDate, JSON.stringify(newMetadata), id],
              function(err) {
                if (err) reject(err);
                else resolve({ success: true, id, status: 'resolved' });
              }
            );
          }
        });
      });
    }
  },
  
  issues_delete: {
    name: 'issues_delete',
    description: 'Delete an issue',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Issue ID' }
      },
      required: ['id']
    },
    fn: async (args) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM issues WHERE id = ?', [args.id], function(err) {
          if (err) reject(err);
          else resolve({ success: true, deleted: this.changes });
        });
      });
    }
  },

  // Vault
  vault_list: {
    name: 'vault_list',
    description: 'List all vault solutions',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        limit: { type: 'number', description: 'Limit number of results' }
      }
    },
    fn: async (args) => {
      let sql = 'SELECT * FROM vault_solutions';
      const params = [];
      
      if (args.category) { sql += ' WHERE category = ?'; params.push(args.category); }
      sql += ' ORDER BY usage_count DESC';
      
      if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }
      
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : [],
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
          })));
        });
      });
    }
  },
  
  vault_search: {
    name: 'vault_search',
    description: 'Search vault solutions',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    },
    fn: async (args) => {
      const query = args.query.toLowerCase();
      
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM vault_solutions', [], (err, rows) => {
          if (err) reject(err);
          else {
            const results = rows.filter(row => 
              row.title.toLowerCase().includes(query) ||
              row.description.toLowerCase().includes(query) ||
              (row.tags && JSON.parse(row.tags).some(t => t.toLowerCase().includes(query)))
            );
            resolve(results.map(row => ({
              ...row,
              tags: row.tags ? JSON.parse(row.tags) : [],
              metadata: row.metadata ? JSON.parse(row.metadata) : {}
            })));
          }
        });
      });
    }
  },

  // Processing Runs
  processing_runs_list: {
    name: 'processing_runs_list',
    description: 'List processing runs with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        data_source_id: { type: 'string', description: 'Filter by data source ID' },
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Limit number of results' }
      }
    },
    fn: async (args) => {
      let sql = 'SELECT * FROM processing_runs';
      const params = [];
      const filters = [];
      
      if (args.data_source_id) { filters.push('data_source_id = ?'); params.push(args.data_source_id); }
      if (args.status) { filters.push('status = ?'); params.push(args.status); }
      
      if (filters.length > 0) sql += ' WHERE ' + filters.join(' AND ');
      sql += ' ORDER BY started_at DESC';
      
      if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }
      
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => {
            const { metadata, ...rest } = row;
            return { ...rest, ...(metadata ? JSON.parse(metadata) : {}) };
          }));
        });
      });
    }
  },
  
  processing_runs_create: {
    name: 'processing_runs_create',
    description: 'Start a new processing run',
    inputSchema: {
      type: 'object',
      properties: {
        data_source_id: { type: 'string', description: 'Data source ID' },
        status: { type: 'string', description: 'Initial status' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['data_source_id']
    },
    fn: async (args) => {
      const id = args.id || generateId();
      const startedAt = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO processing_runs (id, data_source_id, status, started_at, created_date, updated_date, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, args.data_source_id, args.status || 'pending', startedAt, startedAt, startedAt, JSON.stringify(args.metadata || {})],
          function(err) {
            if (err) reject(err);
            else resolve({ id, data_source_id: args.data_source_id, status: args.status, started_at: startedAt });
          }
        );
      });
    }
  },
  
  processing_runs_complete: {
    name: 'processing_runs_complete',
    description: 'Mark a processing run as complete',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Run ID' },
        status: { type: 'string', description: 'Final status (completed, failed)' },
        records_processed: { type: 'number', description: 'Number of records processed' },
        records_failed: { type: 'number', description: 'Number of records failed' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['id']
    },
    fn: async (args) => {
      const id = args.id;
      const finishedAt = new Date().toISOString();
      
      return new Promise((resolve, reject) => {
        db.get('SELECT started_at, metadata FROM processing_runs WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            const durationMs = new Date(finishedAt) - new Date(row.started_at);
            const currentMetadata = row.metadata ? JSON.parse(row.metadata) : {};
            const newMetadata = { ...currentMetadata, ...(args.metadata || {}) };
            
            db.run(
              'UPDATE processing_runs SET status = ?, finished_at = ?, duration_ms = ?, records_processed = ?, records_failed = ?, updated_date = ?, metadata = ? WHERE id = ?',
              [args.status || 'completed', finishedAt, durationMs, args.records_processed || 0, args.records_failed || 0, finishedAt, JSON.stringify(newMetadata), id],
              function(err) {
                if (err) reject(err);
                else resolve({ success: true, id, status: args.status, finished_at: finishedAt, duration_ms: durationMs });
              }
            );
          }
        });
      });
    }
  },

  // System
  system_health: {
    name: 'system_health',
    description: 'Get system health status',
    inputSchema: { type: 'object', properties: {} },
    fn: async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    }
  },
  
  system_stats: {
    name: 'system_stats',
    description: 'Get system statistics',
    inputSchema: { type: 'object', properties: {} },
    fn: async () => {
      const stats = {};
      
      const tables = ['projects', 'datasets', 'data_sources', 'issues', 'vault_solutions', 'processing_runs'];
      
      for (const table of tables) {
        stats[table] = await new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM ${table}`, [], (err, row) => {
            resolve(row ? row.count : 0);
          });
        });
      }
      
      return stats;
    }
  }
};

export function getToolDefinitions() {
  return Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
}

export async function handleToolCall(toolName, args) {
  const tool = tools[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return tool.fn(args);
}

export async function handleJsonRpc(request) {
  const { jsonrpc, id, method, params } = request;
  
  if (jsonrpc !== '2.0') {
    return buildError(id, -32600, 'Invalid JSON-RPC version');
  }
  
  if (method === 'tools/list') {
    return buildResponse(id, { tools: getToolDefinitions() });
  }
  
  if (method === 'tools/call') {
    try {
      const result = await handleToolCall(params.name, params.arguments || {});
      return buildResponse(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
    } catch (error) {
      return buildError(id, -32000, error.message);
    }
  }
  
  if (method === 'initialize') {
    return buildResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'tracertrail-mcp', version: '1.0.0' }
    });
  }
  
  return buildError(id, -32601, 'Method not found');
}

export default { getToolDefinitions, handleToolCall, handleJsonRpc };
