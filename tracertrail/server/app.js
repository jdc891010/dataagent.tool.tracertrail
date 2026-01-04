import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import projectRoutes from './routes/projects.js';
import datasourceRoutes from './routes/datasources.js';
import datasetRoutes from './routes/datasets.js';
import issueRoutes from './routes/issues.js';
import vaultRoutes from './routes/vault.js';
import processingRunRoutes from './routes/processing_runs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure storage/uploads directory exists
const uploadsDir = path.join(__dirname, 'storage/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but prepend timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // Prevent caching for API and HTML to avoid stale clients
  if (req.url.startsWith('/api') || req.url.endsWith('.html') || req.url === '/') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Dummy route for @vite/client to prevent client-side reload loops if it's requested
app.get('/@vite/client', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send('// No-op for production');
});
app.use(bodyParser.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// File Upload Route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the URL to access the file
  // Since this app is mounted at /api, the URL will be /api/uploads/filename
  const fileUrl = `/api/uploads/${req.file.filename}`;
  
  res.json({ 
    success: true, 
    file_url: fileUrl,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Swagger Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TracerTrail API',
      version: '1.0.0',
      description: 'API for TracerTrail Data Quality Agent',
    },
    servers: [
      {
        url: '/api',
        description: 'Vite Dev Server API',
      },
    ],
  },
  apis: [path.join(__dirname, 'routes/*.js')],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Routes
// Note: When used as Vite middleware, the prefix '/api' is usually stripped or handled by the mount point.
// However, Vite's `server.middlewares.use` doesn't strip prefixes automatically like `app.use('/api', ...)` does in nested Express apps.
// We will mount this app at `/api` in vite.config.js, so requests to `/api/projects` will hit this app with url `/projects` if stripped, or `/api/projects` if not.
// Vite's `connect` middleware usually passes the full URL.
// To be safe, we'll use a router that handles the paths relative to the mount point, assuming the mount point is `/api`.

const apiRouter = express.Router();
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/datasources', datasourceRoutes);
apiRouter.use('/datasets', datasetRoutes);
apiRouter.use('/issues', issueRoutes);
apiRouter.use('/vault', vaultRoutes);
apiRouter.use('/processing-runs', processingRunRoutes);
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
apiRouter.get('/openapi.json', (req, res) => res.json(swaggerDocs));

// Check if running directly (not imported by Vite)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (process.env.NODE_ENV === 'production' || isMainModule) {
  console.log('Starting server in standalone mode...');
  app.use('/api', apiRouter);
  
  // Serve static files
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // Fallback to index.html
  app.get(/.*/, (req, res) => {
    // Only serve index.html for navigation routes, not for assets or API
    if (!req.path.startsWith('/api') && !req.path.includes('.')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('[Error]', err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  const PORT = process.env.PORT || 8081;
  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // In development (Vite middleware), routes are at root
  app.use('/', apiRouter);
}

export default app;
