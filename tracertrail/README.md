# DataAgent TraceTrail

**DataAgent TraceTrail** is a comprehensive data quality management and visualization platform that helps organizations track, analyze, and resolve data quality issues across their data ecosystem. Built as a React application using the DataAgent SDK, it provides powerful tools for data lineage visualization, issue tracking, and data governance.

## 🎯 Objectives

- **Data Quality Monitoring**: Track and manage data quality issues across projects, datasets, and data sources
- **Data Lineage Visualization**: Visualize relationships between data projects, datasets, and sources
- **Issue Resolution Workflow**: Provide a structured workflow for identifying, categorizing, and resolving data quality problems
- **Data Governance**: Enable centralized management of data assets and their relationships

## 🏗️ Structure

```
tracertrail/
├── src/
│   ├── api/                    # API clients and entity definitions
│   │   ├── dataAgentClient.js  # DataAgent SDK client configuration
│   │   ├── entities.js         # Entity definitions
│   │   └── integrations.js     # Integration utilities
│   ├── components/             # Reusable UI components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── datasource/         # Data source components
│   │   ├── forms/              # Form components
│   │   ├── issues/             # Issue management components
│   │   ├── lineage/            # Data lineage visualization
│   │   ├── navigation/         # Navigation components
│   │   ├── ui/                 # Base UI components (buttons, cards, etc.)
│   │   └── vault/              # Vault/security components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── pages/                  # Application pages and routing
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── DataFlows.jsx       # Data flow management
│   │   ├── DataLineage.jsx     # Interactive lineage visualization
│   │   ├── DataSourceDetail.jsx # Data source details
│   │   ├── DatasetDetail.jsx   # Dataset details
│   │   ├── Datasets.jsx        # Dataset listings
│   │   ├── DataSources.jsx     # Data source listings
│   │   ├── EditIssue.jsx       # Issue editing interface
│   │   ├── Export.jsx          # Data export functionality
│   │   ├── Guide.jsx           # User guide
│   │   ├── Home.jsx            # Home page
│   │   ├── IssueAnalytics.jsx  # Issue analytics and reporting
│   │   ├── IssueDetail.jsx     # Issue detail view
│   │   ├── Layout.jsx          # Application layout
│   │   ├── NewDataSource.jsx   # New data source creation
│   │   ├── NewIssue.jsx        # New issue creation
│   │   ├── ProjectDetail.jsx   # Project detail view
│   │   ├── ProjectHealth.jsx   # Project health analytics
│   │   ├── Projects.jsx        # Project listings
│   │   ├── Settings.jsx        # Application settings
│   │   └── Vault.jsx           # Security/vault features
│   ├── utils/                  # Utility functions
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Application-specific styles
│   ├── index.css               # Global styles
│   └── main.jsx                # Application entry point
├── public/                     # Static assets
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite build configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── eslint.config.js            # ESLint configuration
└── README.md                   # This file
```

## ✨ Features

### Dashboard
- Overview of data quality issues across all projects
- Quick access to in-progress data sources
- Issue statistics and filtering capabilities
- Hierarchical and list views of issues

### Data Lineage Visualization
- Interactive graph showing relationships between projects, datasets, and data sources
- Color-coded nodes indicating issue severity levels
- Zoom and pan functionality for exploring complex data relationships
- Filtering by project and dataset

### Issue Management
- Comprehensive issue tracking with severity levels (critical, high, medium, low)
- Status tracking (open, in progress, fixed, verified, won't fix)
- Issue categorization by type and project
- Detailed issue views with affected columns

### Data Source Management
- Tracking of data source ingestion status
- Quality scoring for data sources
- Connection to datasets and projects

### Analytics & Reporting
- Project health analytics
- Issue trend analysis
- Export capabilities for reports

## 🛠️ Technologies

- **React** (v18.2.0) - Frontend library
- **Vite** (v6.1.0) - Build tool and development server
- **DataAgent SDK** - API client for data management
- **Tailwind CSS** - Styling framework
- **React Router DOM** - Client-side routing
- **React Query** - Server state management
- **Radix UI** - Accessible UI primitives
- **Lucide React** - Icon library
- **Recharts** - Charting library
- **Framer Motion** - Animation library

## 🚀 Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/dataagent-tool/tracertrail.git

# Navigate to the project directory
cd tracertrail

# Install dependencies
npm install
```

### Running the Application
```bash
# Start the development server
npm run dev

# The application will be available at http://localhost:5173
```

### Building for Production
```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

### Linting
```bash
# Run ESLint to check for code quality issues
npm run lint
```

## 📋 Scripts

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build locally

## 🤝 Contribution

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file in the parent directory for details.

## 📞 Support

For technical support and questions, please submit an issue in the [main repository](https://github.com/dataagent-tool/tracertrail/issues).

---

Built with ❤️ using React, Vite, and DataAgent SDK