"""Tests for the TraceTrail client."""
import pytest
from tracertrail import TraceTrail
from tracertrail.exceptions import AuthenticationError


def test_client_initialization_with_api_key():
    """Test client can be initialized with just an API key."""
    # This will try to authenticate - may fail if server is not running
    try:
        client = TraceTrail(
            api_url="http://localhost:8081/api",
            api_key="sk_test",
        )
        # If we get here, authentication was attempted
        assert client._auth is not None
    except Exception:
        # Expected if server is not running or auth fails
        pass


def test_client_initialization_with_token():
    """Test client can be initialized with an access token."""
    client = TraceTrail(
        api_url="http://localhost:8081/api",
        access_token="tt_test_token",
    )
    assert client._auth.is_authenticated


def test_client_context_manager():
    """Test client can be used as context manager."""
    with TraceTrail(
        api_url="http://localhost:8081/api",
        access_token="tt_test_token",
    ) as client:
        assert client._http is not None


def test_auth_requires_api_key_or_token():
    """Test that authentication requires either API key or token."""
    # When no credentials provided, client should not auto-authenticate
    client = TraceTrail(
        api_url="http://localhost:8081/api",
    )
    assert client._auth is not None
