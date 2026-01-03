import pytest
import requests
import uuid
import time

def test_health_check(api_base_url):
    """
    Basic connectivity test to ensure the API is reachable.
    Using projects endpoint as a health check since there isn't a dedicated /health endpoint.
    """
    try:
        response = requests.get(f"{api_base_url}/projects")
        assert response.status_code == 200
    except requests.exceptions.ConnectionError:
        pytest.fail(f"Could not connect to API at {api_base_url}. Is the server running?")

def test_get_projects(api_base_url):
    """Test retrieving the list of projects."""
    response = requests.get(f"{api_base_url}/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # If there are projects, verify structure
    if len(data) > 0:
        assert "id" in data[0]
        assert "name" in data[0]

def test_create_and_retrieve_project(api_base_url):
    """Test creating a new project and verifying it exists."""
    unique_id = f"test-proj-{uuid.uuid4().hex[:8]}"
    project_data = {
        "id": unique_id,
        "name": f"Test Project {unique_id}",
        "description": "Created by Python Integration Tests",
        "client": "Test Client",
        "status": "active"
    }
    
    # Create Project
    response = requests.post(f"{api_base_url}/projects", json=project_data)
    
    # Note: Depending on implementation, POST might return the created object or just status
    # Adjust assertions based on actual API behavior
    if response.status_code == 200 or response.status_code == 201:
        data = response.json()
        # Handle case where API might not return the full object or ID
        # But we know the ID we sent
        
        # Verify it can be retrieved
        get_response = requests.get(f"{api_base_url}/projects", params={"id": unique_id})
        assert get_response.status_code == 200
        get_data = get_response.json()
        
        # The API returns a list when filtering?
        # Based on server/routes/projects.js: items = items.filter(...)
        # So it likely returns a list of 1
        assert isinstance(get_data, list)
        assert len(get_data) >= 1
        assert get_data[0]["id"] == unique_id
        assert get_data[0]["name"] == project_data["name"]
    else:
        pytest.fail(f"Failed to create project: {response.status_code} - {response.text}")

def test_get_datasources(api_base_url):
    """Test retrieving data sources."""
    response = requests.get(f"{api_base_url}/datasources")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_datasets(api_base_url):
    """Test retrieving datasets."""
    response = requests.get(f"{api_base_url}/datasets")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
