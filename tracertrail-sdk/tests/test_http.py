"""Tests for HTTP client wrapper."""
import pytest
from tracertrail.http import HTTPClient
from tracertrail.exceptions import ConnectionError, TimeoutError, ValidationError


def test_http_client_initialization():
    """Test HTTP client can be initialized."""
    client = HTTPClient(base_url="http://localhost:8081/api")
    assert client.base_url == "http://localhost:8081/api"
    client.close()


def test_http_client_context_manager():
    """Test HTTP client as context manager."""
    with HTTPClient(base_url="http://localhost:8081/api") as client:
        # Access the client to trigger initialization
        _ = client._get_client()
        assert client._client is not None


def test_http_client_set_header():
    """Test setting headers."""
    client = HTTPClient(base_url="http://localhost:8081/api")
    client.set_header("Authorization", "Bearer test")
    assert client._headers["Authorization"] == "Bearer test"
    client.close()
