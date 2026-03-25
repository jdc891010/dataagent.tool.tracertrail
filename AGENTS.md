# TraceTrail Agent Guidelines

This file contains guidelines and commands for AI agents operating in this repository.

---

## 1. Build, Lint, and Test Commands

### Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd tracertrail

# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix
```

### Backend (Node.js/Express)

```bash
# Start server standalone
npm run server

# Start MCP server (stdio mode for AI agents)
npm run mcp
```

### Running Tests

```bash
# Run all tests
npm test

# Run Playwright tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed
```

### Python SDK (tracertrail-sdk)

```bash
# Install SDK in development mode
cd tracertrail-sdk
pip install -e .

# Or with uv
cd tracertrail-sdk
uv pip install -e .

# Run Python tests (when configured)
pytest tests/
```

---

## 2. Code Style Guidelines

### JavaScript/JSX (Frontend)

**File Organization:**
- Use `.jsx` extension for React components
- Use `.js` extension for utility files
- Components go in `src/components/`
- Pages go in `src/pages/`
- API clients in `src/api/`

**Naming Conventions:**
- Components: PascalCase (`ProjectList.jsx`)
- Files: camelCase (`apiClient.js`)
- CSS classes: kebab-case (or use Tailwind)
- Constants: UPPER_SNAKE_CASE

**Import Order:**
1. React imports
2. External libraries
3. Internal components
4. Internal utilities
5. Styles (if any)

```javascript
// Correct import order
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppNav from '@/components/navigation/AppNav';
import { dataAgent } from '@/api/dataAgentClient';
import { format } from 'date-fns';
```

**Component Structure:**
```javascript
// Functional component with hooks
export default function ComponentName() {
  // State
  const [state, setState] = useState(initialValue);
  
  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['key'],
    queryFn: () => fetchData()
  });
  
  // Effects
  useEffect(() => {
    // side effects
    return () => cleanup();
  }, [dependency]);
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Node.js/Express (Backend)

**File Organization:**
- Routes in `server/routes/`
- Middleware in `server/middleware/`
- Database in `server/database.js`
- MCP server in `server/mcp/`

**Naming Conventions:**
- Route files: camelCase (`projects.js`)
- Middleware: camelCase (`auth.js`)

**Route Structure:**
```javascript
import express from 'express';
import db from '../database.js';

const router = express.Router();

// Swagger docs in JSDoc format
/**
 * @swagger
 * /endpoint:
 *   get:
 *     summary: Description
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', (req, res) => {
  // Implementation
});

export default router;
```

**Database Operations:**
- Use parameterized queries to prevent SQL injection
- Use async/await with proper error handling
- Return meaningful error messages

### Python (SDK)

**File Organization:**
- Package in `tracertrail-sdk/tracertrail/`
- Tests in `tracertrail-sdk/tests/`

**Style (PEP 8 + Google):**
- Use type hints throughout
- Add docstrings to all public functions
- Use Pydantic models for data validation
- Follow import order (PEP 8)

```python
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Project(BaseModel):
    """Project model for TraceTrail."""
    id: str
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    created_date: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "proj_123",
                "name": "Customer Data"
            }
        }
```

---

## 3. Error Handling

### Frontend
- Use try/catch with async operations
- Display errors with sonner toasts
- Handle loading and error states in components

### Backend
- Return proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 404: Not Found
  - 500: Server Error

```javascript
// Example error handling
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});
```

---

## 4. Database Conventions

- Primary keys: UUID-like strings (use `generateId()` helper)
- Timestamps: ISO 8601 format (`new Date().toISOString()`)
- Foreign keys: Use `REFERENCES table(id)` in CREATE statements

---

## 5. API Conventions

**REST Endpoints:**
- GET /resource - List
- GET /resource/:id - Get single
- POST /resource - Create
- PUT /resource/:id - Update
- DELETE /resource/:id - Delete

**Authentication:**
- Bearer token in Authorization header
- Token obtained from `/api/auth/token/issue`
- API keys created from UI Settings page

---

## 6. Running the Application

```bash
# Development (frontend + API proxy)
cd tracertrail
npm run dev

# Standalone server (production-like)
cd tracertrail
npm run server
# API available at http://localhost:8081/api

# MCP server for AI agents
npm run mcp
```

---

## 7. Important Notes

- The server runs on port 8081
- Frontend proxies `/api` to backend
- Use `@/` alias for imports (defined in vite.config.js)
- SQLite database stored in `tracertrail/server/storage/tracertrail.db`
- API documentation at `/api/docs` (Swagger UI)
- OpenAPI spec at `/api/openapi.json`
