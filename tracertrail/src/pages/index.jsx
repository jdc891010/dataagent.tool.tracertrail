import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import DataFlows from "./DataFlows";

import DataLineage from "./DataLineage";

import DataSourceDetail from "./DataSourceDetail";

import DatasetDetail from "./DatasetDetail";

import Datasets from "./Datasets";

import EditIssue from "./EditIssue";

import Export from "./Export";

import Guide from "./Guide";

import Home from "./Home";

import IssueAnalytics from "./IssueAnalytics";

import IssueDetail from "./IssueDetail";

import NewDataSource from "./NewDataSource";

import NewIssue from "./NewIssue";

import ProjectDetail from "./ProjectDetail";

import ProjectHealth from "./ProjectHealth";

import Projects from "./Projects";

import Settings from "./Settings";

import Vault from "./Vault";

import DataSources from "./DataSources";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    DataFlows: DataFlows,
    
    DataLineage: DataLineage,
    
    DataSourceDetail: DataSourceDetail,
    
    DatasetDetail: DatasetDetail,
    
    Datasets: Datasets,
    
    EditIssue: EditIssue,
    
    Export: Export,
    
    Guide: Guide,
    
    Home: Home,
    
    IssueAnalytics: IssueAnalytics,
    
    IssueDetail: IssueDetail,
    
    NewDataSource: NewDataSource,
    
    NewIssue: NewIssue,
    
    ProjectDetail: ProjectDetail,
    
    ProjectHealth: ProjectHealth,
    
    Projects: Projects,
    
    Settings: Settings,
    
    Vault: Vault,
    
    DataSources: DataSources,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/DataFlows" element={<DataFlows />} />
                
                <Route path="/DataLineage" element={<DataLineage />} />
                
                <Route path="/DataSourceDetail" element={<DataSourceDetail />} />
                
                <Route path="/DatasetDetail" element={<DatasetDetail />} />
                
                <Route path="/Datasets" element={<Datasets />} />
                
                <Route path="/EditIssue" element={<EditIssue />} />
                
                <Route path="/Export" element={<Export />} />
                
                <Route path="/Guide" element={<Guide />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/IssueAnalytics" element={<IssueAnalytics />} />
                
                <Route path="/IssueDetail" element={<IssueDetail />} />
                
                <Route path="/NewDataSource" element={<NewDataSource />} />
                
                <Route path="/NewIssue" element={<NewIssue />} />
                
                <Route path="/ProjectDetail" element={<ProjectDetail />} />
                
                <Route path="/ProjectHealth" element={<ProjectHealth />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Vault" element={<Vault />} />
                
                <Route path="/DataSources" element={<DataSources />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}