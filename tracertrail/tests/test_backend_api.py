import pytest
import requests
import uuid
import time
from datetime import datetime

# --- Helper Functions ---

def create_project(api_url, name_suffix=""):
    """Helper to create a project."""
    unique_id = f"test-proj-{uuid.uuid4().hex[:8]}"
    project_data = {
        "id": unique_id,
        "name": f"Test Project {name_suffix} {unique_id}",
        "description": "Created by Python Integration Tests",
        "client": "Test Client",
        "status": "active"
    }
    response = requests.post(f"{api_url}/projects", json=project_data)
    assert response.status_code in [200, 201], f"Failed to create project: {response.text}"
    return response.json()

def create_datasource(api_url, project_id):
    """Helper to create a datasource."""
    unique_id = f"test-ds-{uuid.uuid4().hex[:8]}"
    ds_data = {
        "id": unique_id,
        "project_id": project_id,
        "name": f"Test DataSource {unique_id}",
        "type": "postgres",
        "status": "active",
        "metadata": {"host": "localhost"}
    }
    response = requests.post(f"{api_url}/datasources", json=ds_data)
    assert response.status_code in [200, 201], f"Failed to create datasource: {response.text}"
    return response.json()

# --- Tests ---

def test_health_check(api_base_url):
    """
    Basic connectivity test to ensure the API is reachable.
    """
    try:
        response = requests.get(f"{api_base_url}/projects")
        assert response.status_code == 200
    except requests.exceptions.ConnectionError:
        pytest.fail(f"Could not connect to API at {api_base_url}. Is the server running?")

# --- Projects Tests ---

def test_project_crud(api_base_url):
    """Test Create, Read, Update, Delete for Projects."""
    # 1. Create
    project = create_project(api_base_url, "CRUD")
    project_id = project.get("id")
    assert project_id is not None
    
    # 2. Read (Get All)
    response = requests.get(f"{api_base_url}/projects")
    assert response.status_code == 200
    projects = response.json()
    assert any(p["id"] == project_id for p in projects)
    
    # 3. Read (Get One) - Assuming filter support or client-side filter
    # The API might not support /projects/:id directly based on previous code reading, 
    # but let's check if we can filter by ID query param if supported, or just rely on list verification.
    # Current implementation seems to be list-only or query-param filtered.
    response = requests.get(f"{api_base_url}/projects", params={"id": project_id})
    assert response.status_code == 200
    filtered = response.json()
    assert len(filtered) == 1
    assert filtered[0]["id"] == project_id

    # 4. Update
    update_data = {"description": "Updated Description", "status": "archived"}
    response = requests.put(f"{api_base_url}/projects/{project_id}", json=update_data)
    assert response.status_code == 200
    
    # Verify Update
    response = requests.get(f"{api_base_url}/projects", params={"id": project_id})
    updated_project = response.json()[0]
    assert updated_project["description"] == "Updated Description"
    assert updated_project["status"] == "archived"

    # 5. Delete
    response = requests.delete(f"{api_base_url}/projects/{project_id}")
    assert response.status_code == 200
    
    # Verify Deletion
    response = requests.get(f"{api_base_url}/projects", params={"id": project_id})
    assert response.status_code == 200
    assert len(response.json()) == 0

# --- DataSources Tests ---

def test_datasource_crud(api_base_url):
    """Test CRUD for DataSources."""
    # Setup: Create a project first
    project = create_project(api_base_url, "DS Parent")
    project_id = project["id"]
    
    try:
        # 1. Create
        ds = create_datasource(api_base_url, project_id)
        ds_id = ds.get("id")
        assert ds_id is not None
        assert ds["project_id"] == project_id
        
        # 2. Read
        response = requests.get(f"{api_base_url}/datasources", params={"project_id": project_id})
        assert response.status_code == 200
        datasources = response.json()
        assert any(d["id"] == ds_id for d in datasources)
        
        # 3. Update
        update_data = {"name": "Updated DS Name"}
        response = requests.put(f"{api_base_url}/datasources/{ds_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify Update
        response = requests.get(f"{api_base_url}/datasources", params={"project_id": project_id})
        datasources = response.json()
        updated_ds = next(d for d in datasources if d["id"] == ds_id)
        assert updated_ds["name"] == "Updated DS Name"
        
        # 4. Delete
        response = requests.delete(f"{api_base_url}/datasources/{ds_id}")
        assert response.status_code == 200
        
        # Verify Deletion
        response = requests.get(f"{api_base_url}/datasources", params={"id": ds_id})
        assert len(response.json()) == 0
        
    finally:
        # Cleanup Project
        requests.delete(f"{api_base_url}/projects/{project_id}")

# --- Datasets Tests ---

def test_dataset_lifecycle(api_base_url):
    """Test Dataset creation and retrieval."""
    project = create_project(api_base_url, "Dataset Parent")
    project_id = project["id"]
    
    try:
        unique_id = f"test-dataset-{uuid.uuid4().hex[:8]}"
        dataset_data = {
            "id": unique_id,
            "project_id": project_id,
            "name": "Test Dataset",
            "description": "Test Description"
        }
        
        # Create
        response = requests.post(f"{api_base_url}/datasets", json=dataset_data)
        assert response.status_code in [200, 201]
        
        # List
        response = requests.get(f"{api_base_url}/datasets", params={"project_id": project_id})
        assert response.status_code == 200
        datasets = response.json()
        assert any(d["id"] == unique_id for d in datasets)
        
        # Delete
        requests.delete(f"{api_base_url}/datasets/{unique_id}")
        
    finally:
        requests.delete(f"{api_base_url}/projects/{project_id}")

# --- Issues Tests ---

def test_issues_lifecycle(api_base_url):
    """Test Issues creation, update, and retrieval."""
    # Setup
    project = create_project(api_base_url, "Issue Parent")
    ds = create_datasource(api_base_url, project["id"])
    ds_id = ds["id"]
    
    try:
        # Create Issue
        unique_id = f"issue-{uuid.uuid4().hex[:8]}"
        issue_data = {
            "id": unique_id,
            "data_source_id": ds_id,
            "title": "Data Quality Issue",
            "description": "Null values in column",
            "status": "open",
            "severity": "high"
        }
        
        response = requests.post(f"{api_base_url}/issues", json=issue_data)
        assert response.status_code in [200, 201]
        
        # Retrieve
        response = requests.get(f"{api_base_url}/issues", params={"data_source_id": ds_id})
        assert response.status_code == 200
        issues = response.json()
        assert len(issues) >= 1
        assert issues[0]["severity"] == "high"
        
        # Update Status
        response = requests.put(f"{api_base_url}/issues/{unique_id}", json={"status": "resolved"})
        assert response.status_code == 200
        
        # Verify Update
        response = requests.get(f"{api_base_url}/issues", params={"data_source_id": ds_id})
        issues = response.json()
        updated_issue = next(i for i in issues if i["id"] == unique_id)
        assert updated_issue["status"] == "resolved"
        
    finally:
        # Cleanup
        requests.delete(f"{api_base_url}/datasources/{ds_id}")
        requests.delete(f"{api_base_url}/projects/{project['id']}")

# --- Vault Tests ---

def test_vault_solutions(api_base_url):
    """Test Vault Solutions (Seeded data and New creation)."""
    # 1. Verify Seeded Data
    response = requests.get(f"{api_base_url}/vault")
    assert response.status_code == 200
    solutions = response.json()
    assert len(solutions) > 0
    
    # Verify field mapping (code vs code_snippet)
    first_sol = solutions[0]
    assert "code" in first_sol, "Frontend expected 'code' field missing"
    assert first_sol["code"] is not None
    
    # 2. Create New Solution
    new_sol_data = {
        "title": "Test Python Solution",
        "description": "A test solution",
        "category": "Test",
        "tags": ["python", "test"],
        "code": "print('hello world')",  # Testing frontend field name
        "language": "python",
        "author": "Tester"
    }
    
    response = requests.post(f"{api_base_url}/vault", json=new_sol_data)
    assert response.status_code == 200
    created_sol = response.json()
    assert created_sol["title"] == new_sol_data["title"]
    assert created_sol["code"] == new_sol_data["code"]
    
    # Cleanup (Optional, but good practice)
    # requests.delete(f"{api_base_url}/vault/{created_sol['id']}") # If delete endpoint exists

# --- Processing Runs Tests ---

def test_processing_runs(api_base_url):
    """Test Processing Runs logging."""
    # Setup
    project = create_project(api_base_url, "Run Parent")
    ds = create_datasource(api_base_url, project["id"])
    ds_id = ds["id"]
    
    try:
        # Create Run
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        run_data = {
            "id": run_id,
            "data_source_id": ds_id,
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "metadata": {"job_type": "quality_check"}
        }
        
        response = requests.post(f"{api_base_url}/processing-runs", json=run_data)
        assert response.status_code in [200, 201]
        
        # Update Run (Finish)
        finish_data = {
            "status": "completed",
            "finished_at": datetime.now().isoformat(),
            "records_processed": 100,
            "duration_ms": 500
        }
        response = requests.put(f"{api_base_url}/processing-runs/{run_id}", json=finish_data)
        assert response.status_code == 200
        
        # List Runs
        response = requests.get(f"{api_base_url}/processing-runs", params={"data_source_id": ds_id})
        assert response.status_code == 200
        runs = response.json()
        assert len(runs) >= 1
        assert runs[0]["status"] == "completed"
        
    finally:
        requests.delete(f"{api_base_url}/datasources/{ds_id}")
        requests.delete(f"{api_base_url}/projects/{project['id']}")
