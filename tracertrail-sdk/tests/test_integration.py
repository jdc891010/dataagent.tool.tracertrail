"""Integration tests against live API."""
import pytest
from tracertrail import TraceTrail


@pytest.fixture
def client():
    """Create a client with the test API key."""
    return TraceTrail(
        api_url="http://localhost:8081/api",
        api_key="sk_3c534e68d6308ad314b3bd54545b6e3886e5df51a4f6f13b4f67a548e26bbeb1",
    )


def test_list_projects(client):
    """Test listing projects."""
    projects = client.list_projects()
    assert isinstance(projects, list)


def test_list_datasets(client):
    """Test listing datasets."""
    datasets = client.list_datasets()
    assert isinstance(datasets, list)


def test_list_datasources(client):
    """Test listing datasources."""
    datasources = client.list_datasources()
    assert isinstance(datasources, list)


def test_list_issues(client):
    """Test listing issues."""
    issues = client.list_issues()
    assert isinstance(issues, list)


def test_list_vault(client):
    """Test listing vault solutions."""
    solutions = client.list_solutions()
    assert isinstance(solutions, list)


def test_list_api_keys(client):
    """Test listing API keys."""
    keys = client.list_api_keys()
    assert isinstance(keys, list)


def test_mcp_tools(client):
    """Test MCP tools endpoint."""
    tools = client.list_mcp_tools()
    assert "tools" in tools
    assert len(tools["tools"]) > 0


def test_create_and_delete_project(client):
    """Test creating and deleting a project."""
    # Create
    project = client.create_project(
        name="SDK Test Project",
        description="Created by SDK integration test",
    )
    assert project["name"] == "SDK Test Project"
    project_id = project["id"]

    # Delete
    result = client.delete_project(project_id)
    assert result.get("success") or result.get("deleted", 0) > 0


def test_create_and_delete_issue(client):
    """Test creating and deleting an issue."""
    # Create
    issue = client.create_issue(
        title="SDK Test Issue",
        description="Created by SDK integration test",
        severity="low",
    )
    assert issue["title"] == "SDK Test Issue"
    issue_id = issue["id"]

    # Delete
    result = client.delete_issue(issue_id)
    assert result.get("success") or result.get("deleted", 0) > 0
