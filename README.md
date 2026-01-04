# DataAgent TraceTrail

DataAgent TraceTrail is a comprehensive data quality and lineage tracking platform designed to help data teams identify, document, track, and resolve data quality issues across complex data ecosystems. The platform provides visualization tools for data lineage, issue management workflows, project governance capabilities, and a reusable solution library.

## 🎯 Overview

DataAgent TraceTrail addresses the critical need for data teams to maintain visibility into data flows, quality issues, and their interdependencies. It provides a centralized platform where data engineers, data scientists, and data stewards can track data quality issues from discovery to resolution while maintaining clear visibility into data lineage and dependencies.

## 📢 Project Status & Feedback

**This project is currently in the early stages of development.**

We are actively building core functionality and refining the user experience. As we progress, we warmly welcome your feedback, feature requests, and contributions.

- **Found a bug?** Please open an issue.
- **Have a feature idea?** We'd love to hear it!
- **Want to contribute?** PRs are welcome.

Your input helps shape the future of DataAgent TraceTrail!

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS, Radix UI (shadcn/ui)
- **State Management**: TanStack Query (React Query)
- **Visualization**: Recharts (Analytics), React Flow (Lineage - implied)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (local embedded database)
- **API Documentation**: Swagger / OpenAPI 3.0

### Infrastructure
- **Containerization**: Docker

## 🧩 Key Features

### 🔍 Data Quality Management
- **Issue Tracking**: Comprehensive issue logging with detailed metadata including severity, status, type, and project association.
- **Project Health Dashboard**: Real-time health scores for projects based on open issues, critical incidents, and data quality metrics.
- **Issue Analytics**: Visual analytics and reporting on issue trends, resolution metrics, and severity distribution.

### 📚 Knowledge Base & Solutions
- **Solution Vault**: A centralized library for storing and reusing common data quality fixes, SQL snippets, and Python scripts.
- **Code Management**: Syntax-highlighted code blocks for sharing remediation scripts.
- **Tagging & Categorization**: Organize solutions by issue type (e.g., duplicates, schema changes) and technology.

### 🕸️ Data Lineage & Visualization
- **Interactive Lineage Graphs**: Visual representation of data flows between projects, datasets, and data sources.
- **Hierarchical View**: Organize issues by project hierarchy for better context.
- **Dependency Tracking**: Understand upstream and downstream impacts of data quality issues.

### 🏛️ Project & Data Governance
- **Project Management**: Organize data initiatives with governance classification, compliance requirements, and stewardship information.
- **Dataset Catalog**: Maintain a comprehensive catalog of datasets with metadata, retention policies, and PII indicators.
- **Data Source Monitoring**: Track data sources (API, Stream, Warehouse, File) with status phases and quality scores.

### 🔌 API & Integration
- **RESTful API**: Full programmatic access to all platform entities (Projects, Issues, Datasets).
- **Interactive Documentation**: Built-in Swagger/OpenAPI documentation for exploring and testing API endpoints.
- **Local & Remote Support**: Seamlessly works with local development or remote server configurations.

## 👥 Target Audience

### Primary Users
- **Data Engineers**: Track and resolve data quality issues in pipelines and transformations.
- **Data Scientists**: Monitor data quality and lineage for analytical workflows.
- **Data Stewards**: Govern data assets and ensure compliance with data policies.
- **Analytics Engineers**: Manage data quality in business intelligence and reporting systems.

### Secondary Users
- **Engineering Managers**: Monitor data quality trends and team productivity.
- **Compliance Officers**: Track compliance-related data issues and governance.
- **Product Managers**: Understand data dependencies affecting product features.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn package manager
- Docker (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dataagent-tool/tracertrail.git
   cd dataagent.tool.tracertrail/tracertrail
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Backend Server** (Runs on port 8081)
   ```bash
   npm run server
   ```

4. **Start the Frontend Application** (Runs on port 5173)
   In a new terminal:
   ```bash
   npm run dev
   ```

5. **Access the Application**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

   > **Note**: The backend server must be running for API calls to work. The frontend proxies API requests to `http://localhost:8081`.

### Docker Deployment

The application can be built and deployed using Docker, which serves both the frontend (static files) and backend.

1. **Build the image**
   ```bash
   docker build -t dataagent-tracertrail .
   ```

2. **Run the container**
   ```bash
   docker run -p 8081:80 dataagent-tracertrail
   ```

3. **Access the application**
   Open [http://localhost:8081](http://localhost:8081) (Mapped to container port 80).

## 🛠️ Makefile Automation

The project includes a `Makefile` to simplify common development and CI/CD tasks. You can run these commands from the project root (parent directory of `tracertrail`) to manage the application without manually `cd`-ing into subdirectories.

> **Note**: Windows users may need to install `make` (e.g., via `choco install make`) or use WSL/Git Bash.

### Common Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies for the application |
| `make lint` | Run code quality checks (ESLint) |
| `make test` | Run end-to-end tests (Playwright headless) |
| `make build` | Build the application for production |
| `make docker-build` | Build the Docker image |
| `make docker-run` | Run the application in a Docker container |
| `make help` | Show all available commands |

### Testing Commands

| Command | Description |
|---------|-------------|
| `make test-ui` | Run tests in interactive UI mode |
| `make test-headed` | Run tests in a visible browser window |
| `make test-report` | View the HTML test report |

## 🧠 How to Think About the Solution

DataAgent TraceTrail is designed around the principle that data quality issues should be tracked with the same rigor as software bugs, but with additional context about data lineage and dependencies.

1.  **Issue-First Approach**: Every data quality problem is documented as an issue with rich metadata.
2.  **Lineage-Centric**: Data flows are visualized to show dependencies and impact.
3.  **Governance Integration**: Projects and datasets are classified with governance levels.
4.  **Knowledge Reuse**: Solved issues contribute to the Solution Vault for future reference.

## 📋 Future Features (TODO)

- [ ] **Real-time Data Monitoring**: Add live monitoring and alerting for data quality metrics.
- [ ] **Authentication**: Implement user authentication and role-based access control (RBAC).
- [ ] **Advanced Search**: Full-text search across all entities.
- [ ] **Git Integration**: Version control for data quality rules and vault solutions.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

- **Report bugs**: Open an issue if you encounter any problems
- **Suggest features**: Share your ideas for new functionality
- **Submit pull requests**: Fix bugs or implement new features
- **Improve documentation**: Help make our docs clearer and more comprehensive

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

Need help or have questions?

- Check the [Issues](https://github.com/jdc891010/dataagent.tool.tracertrail/issues) page for similar questions
- Open a new issue for bug reports or feature requests
- Join our community discussions (when available)