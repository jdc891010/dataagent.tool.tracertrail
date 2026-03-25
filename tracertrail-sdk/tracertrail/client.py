"""Main TraceTrail client."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any

from .auth import Auth
from .config import Config
from .exceptions import (
    APIError,
    AuthenticationError,
    NotFoundError,
    TraceTrailError,
)
from .http import HTTPClient
from .models import (
    ApiKey,
    DataSource,
    Dataset,
    HealthStatus,
    Issue,
    ProcessingRun,
    Project,
    SystemStats,
    TokenResponse,
    VaultSolution,
)

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence


class TraceTrail:
    """Main client for interacting with the TraceTrail API."""

    def __init__(
        self,
        api_url: str = "http://localhost:8081/api",
        api_key: str | None = None,
        access_token: str | None = None,
        token_expires_at: str | None = None,
        timeout: float = 30.0,
        auto_refresh: bool = True,
        refresh_buffer: int = 300,
    ) -> None:
        self._config = Config(
            api_url=api_url,
            timeout=timeout,
            auto_refresh=auto_refresh,
            refresh_buffer=refresh_buffer,
        )

        self._http = HTTPClient(
            base_url=api_url,
            timeout=timeout,
        )

        self._auth = Auth(
            http_client=self._http,
            api_key=api_key,
            access_token=access_token,
            token_expires_at=token_expires_at,
            auto_refresh=auto_refresh,
            refresh_buffer=refresh_buffer,
        )

    @property
    def auth(self) -> Auth:
        """Get the auth module."""
        return self._auth

    def _request(self, method: str, endpoint: str, **kwargs: Any) -> dict[str, Any]:
        """Make an authenticated request to the API."""
        self._auth.ensure_valid_token()

        try:
            response = self._http.request(method, endpoint, **kwargs)
            return response.json()
        except APIError as e:
            raise e
        except Exception as e:
            raise TraceTrailError(f"Request failed: {e}") from e

    # ==================== Projects ====================

    def list_projects(
        self,
        id: str | None = None,
        name: str | None = None,
        limit: int | None = None,
    ) -> Any:
        """List all projects."""
        params = {}
        if id:
            params["id"] = id
        if name:
            params["name"] = name
        if limit:
            params["limit"] = limit

        return self._request("GET", "/projects", params=params)

    def get_project(self, project_id: str) -> Any:
        """Get a project by ID."""
        return self._request("GET", f"/projects/{project_id}")

    def create_project(
        self,
        name: str,
        description: str = "",
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Create a new project."""
        data = {"name": name, "description": description, **kwargs}
        return self._request("POST", "/projects", json=data)

    def update_project(
        self,
        project_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Update a project."""
        return self._request("PUT", f"/projects/{project_id}", json=kwargs)

    def delete_project(self, project_id: str) -> dict[str, Any]:
        """Delete a project."""
        return self._request("DELETE", f"/projects/{project_id}")

    # ==================== Datasets ====================

    def list_datasets(
        self,
        project_id: str | None = None,
        id: str | None = None,
        name: str | None = None,
        limit: int | None = None,
    ) -> Any:
        """List all datasets."""
        params = {}
        if project_id:
            params["project_id"] = project_id
        if id:
            params["id"] = id
        if name:
            params["name"] = name
        if limit:
            params["limit"] = limit

        return self._request("GET", "/datasets", params=params)

    def get_dataset(self, dataset_id: str) -> dict[str, Any]:
        """Get a dataset by ID."""
        return self._request("GET", f"/datasets/{dataset_id}")

    def create_dataset(
        self,
        name: str,
        project_id: str | None = None,
        description: str = "",
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Create a new dataset."""
        data = {"name": name, "project_id": project_id, "description": description, **kwargs}
        return self._request("POST", "/datasets", json=data)

    def update_dataset(
        self,
        dataset_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Update a dataset."""
        return self._request("PUT", f"/datasets/{dataset_id}", json=kwargs)

    def delete_dataset(self, dataset_id: str) -> dict[str, Any]:
        """Delete a dataset."""
        return self._request("DELETE", f"/datasets/{dataset_id}")

    # ==================== Data Sources ====================

    def list_datasources(
        self,
        project_id: str | None = None,
        dataset_id: str | None = None,
        type: str | None = None,
        status: str | None = None,
        limit: int | None = None,
    ) -> Any:
        """List all data sources."""
        params = {}
        if project_id:
            params["project_id"] = project_id
        if dataset_id:
            params["dataset_id"] = dataset_id
        if type:
            params["type"] = type
        if status:
            params["status"] = status
        if limit:
            params["limit"] = limit

        return self._request("GET", "/datasources", params=params)

    def get_datasource(self, datasource_id: str) -> dict[str, Any]:
        """Get a data source by ID."""
        return self._request("GET", f"/datasources/{datasource_id}")

    def create_datasource(
        self,
        name: str,
        project_id: str | None = None,
        type: str = "api",
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Create a new data source."""
        data = {"name": name, "project_id": project_id, "type": type, **kwargs}
        return self._request("POST", "/datasources", json=data)

    def update_datasource(
        self,
        datasource_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Update a data source."""
        return self._request("PUT", f"/datasources/{datasource_id}", json=kwargs)

    def delete_datasource(self, datasource_id: str) -> dict[str, Any]:
        """Delete a data source."""
        return self._request("DELETE", f"/datasources/{datasource_id}")

    # ==================== Issues ====================

    def list_issues(
        self,
        data_source_id: str | None = None,
        status: str | None = None,
        severity: str | None = None,
        limit: int | None = None,
    ) -> Any:
        """List all issues."""
        params = {}
        if data_source_id:
            params["data_source_id"] = data_source_id
        if status:
            params["status"] = status
        if severity:
            params["severity"] = severity
        if limit:
            params["limit"] = limit

        return self._request("GET", "/issues", params=params)

    def get_issue(self, issue_id: str) -> dict[str, Any]:
        """Get an issue by ID."""
        return self._request("GET", f"/issues/{issue_id}")

    def create_issue(
        self,
        title: str,
        description: str = "",
        severity: str = "medium",
        status: str = "open",
        data_source_id: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Create a new issue."""
        data = {
            "title": title,
            "description": description,
            "severity": severity,
            "status": status,
            **kwargs,
        }
        if data_source_id:
            data["data_source_id"] = data_source_id

        return self._request("POST", "/issues", json=data)

    def update_issue(
        self,
        issue_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Update an issue."""
        return self._request("PUT", f"/issues/{issue_id}", json=kwargs)

    def resolve_issue(
        self,
        issue_id: str,
        resolution: str = "",
    ) -> dict[str, Any]:
        """Mark an issue as resolved."""
        data = {"status": "resolved"}
        if resolution:
            data["resolution"] = resolution

        return self._request("PUT", f"/issues/{issue_id}", json=data)

    def delete_issue(self, issue_id: str) -> dict[str, Any]:
        """Delete an issue."""
        return self._request("DELETE", f"/issues/{issue_id}")

    # ==================== Vault Solutions ====================

    def list_solutions(
        self,
        category: str | None = None,
        limit: int | None = None,
    ) -> Any:
        """List vault solutions."""
        params = {}
        if category:
            params["category"] = category
        if limit:
            params["limit"] = limit

        return self._request("GET", "/vault", params=params)

    def search_solutions(self, query: str) -> list[dict[str, Any]]:
        """Search vault solutions."""
        return self._request("GET", "/vault", params={"q": query})

    def get_solution(self, solution_id: str) -> dict[str, Any]:
        """Get a vault solution by ID."""
        return self._request("GET", f"/vault/{solution_id}")

    def create_solution(
        self,
        title: str,
        code_snippet: str,
        description: str = "",
        category: str = "",
        language: str = "sql",
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Create a new vault solution."""
        data = {
            "title": title,
            "code_snippet": code_snippet,
            "description": description,
            "category": category,
            "language": language,
            **kwargs,
        }
        return self._request("POST", "/vault", json=data)

    def update_solution(
        self,
        solution_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Update a vault solution."""
        return self._request("PUT", f"/vault/{solution_id}", json=kwargs)

    def delete_solution(self, solution_id: str) -> dict[str, Any]:
        """Delete a vault solution."""
        return self._request("DELETE", f"/vault/{solution_id}")

    # ==================== Processing Runs ====================

    def list_processing_runs(
        self,
        data_source_id: str | None = None,
        status: str | None = None,
        limit: int | None = None,
    ) -> Any:
        """List processing runs."""
        params = {}
        if data_source_id:
            params["data_source_id"] = data_source_id
        if status:
            params["status"] = status
        if limit:
            params["limit"] = limit

        return self._request("GET", "/processing-runs", params=params)

    def get_processing_run(self, run_id: str) -> dict[str, Any]:
        """Get a processing run by ID."""
        return self._request("GET", f"/processing-runs/{run_id}")

    def start_processing_run(
        self,
        data_source_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Start a new processing run."""
        data = {"data_source_id": data_source_id, "status": "in_progress", **kwargs}
        return self._request("POST", "/processing-runs", json=data)

    def complete_processing_run(
        self,
        run_id: str,
        status: str = "completed",
        records_processed: int = 0,
        records_failed: int = 0,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Mark a processing run as complete."""
        data = {
            "status": status,
            "records_processed": records_processed,
            "records_failed": records_failed,
            **kwargs,
        }
        return self._request("PUT", f"/processing-runs/{run_id}", json=data)

    def cancel_processing_run(self, run_id: str) -> dict[str, Any]:
        """Cancel a processing run."""
        return self.complete_processing_run(run_id, status="cancelled")

    # ==================== MCP Tools ====================

    def list_mcp_tools(self) -> dict[str, Any]:
        """List all available MCP tools."""
        return self._request("GET", "/mcp/tools")

    def call_mcp_tool(self, tool_name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
        """Call an MCP tool."""
        return self._request(
            "POST",
            "/mcp",
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments or {},
                },
            },
        )

    # ==================== API Keys ====================

    def list_api_keys(self) -> list[dict[str, Any]]:
        """List all API keys."""
        return self._request("GET", "/auth/keys")

    def create_api_key(
        self,
        name: str,
        expires_in: int = 2592000,
        rate_limit: int = 100,
    ) -> dict[str, Any]:
        """Create a new API key."""
        data = {
            "name": name,
            "expires_in": expires_in,
            "rate_limit": rate_limit,
        }
        return self._request("POST", "/auth/keys", json=data)

    def delete_api_key(self, key_id: str) -> dict[str, Any]:
        """Delete an API key."""
        return self._request("DELETE", f"/auth/keys/{key_id}")

    # ==================== Health & Stats ====================

    def health(self) -> dict[str, Any]:
        """Get system health status."""
        return self._request("GET", "/health")

    def stats(self) -> dict[str, Any]:
        """Get system statistics."""
        return self._request("GET", "/stats")

    # ==================== Context Manager ====================

    def __enter__(self) -> "TraceTrail":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self._http.close()
