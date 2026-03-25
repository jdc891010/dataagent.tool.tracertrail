"""HTTP client wrapper using httpx."""
from __future__ import annotations

import httpx
from typing import Any

from .exceptions import (
    APIError,
    AuthenticationError,
    ConnectionError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TimeoutError,
    TraceTrailError,
    ValidationError,
)


class HTTPClient:
    """HTTP client wrapper for TraceTrail API."""

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._headers = headers or {}
        self._client: httpx.Client | None = None

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(
                base_url=self.base_url,
                timeout=self.timeout,
                headers=self._headers,
            )
        return self._client

    def set_header(self, key: str, value: str) -> None:
        """Set a default header for all requests."""
        self._headers[key] = value
        if self._client:
            self._client.headers[key] = value

    def request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make an HTTP request."""
        url = f"{self.base_url}{path}"
        client = self._get_client()

        try:
            response = client.request(method, path, **kwargs)
            return self._handle_response(response)
        except httpx.ConnectError as e:
            raise ConnectionError(f"Failed to connect to {url}: {e}") from e
        except httpx.TimeoutException as e:
            raise TimeoutError(f"Request to {url} timed out: {e}") from e

    def _handle_response(self, response: httpx.Response) -> httpx.Response:
        """Handle the response and raise appropriate exceptions."""
        status = response.status_code

        if 200 <= status < 300:
            return response

        if status == 400:
            raise ValidationError(
                message=response.json().get("error", "Validation failed"),
                response=response.json() if response.text else None,
            )

        if status == 401:
            raise AuthenticationError(
                message=response.json().get("error", "Unauthorized"),
            )

        if status == 404:
            raise NotFoundError(
                message=response.json().get("error", "Not found"),
            )

        if status == 429:
            raise RateLimitError(
                message=response.json().get("error", "Rate limit exceeded"),
                retry_after=int(response.headers.get("Retry-After", "60")),
            )

        if status >= 500:
            raise ServerError(
                message=response.json().get("error", "Server error"),
            )

        raise APIError(
            message=response.json().get("error", "Request failed"),
            status_code=status,
        )

    def get(self, path: str, **kwargs: Any) -> httpx.Response:
        """Make a GET request."""
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> httpx.Response:
        """Make a POST request."""
        return self.request("POST", path, **kwargs)

    def put(self, path: str, **kwargs: Any) -> httpx.Response:
        """Make a PUT request."""
        return self.request("PUT", path, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> httpx.Response:
        """Make a DELETE request."""
        return self.request("DELETE", path, **kwargs)

    def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            self._client.close()
            self._client = None

    def __enter__(self) -> "HTTPClient":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()
