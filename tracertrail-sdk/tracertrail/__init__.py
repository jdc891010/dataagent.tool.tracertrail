"""TraceTrail Python SDK.

A Python client for interacting with the TraceTrail Data Quality Agent API.
"""
from __future__ import annotations

from .auth import Auth
from .client import TraceTrail
from .config import Config
from .exceptions import (
    APIError,
    AuthenticationError,
    ConnectionError,
    InvalidTokenError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TimeoutError,
    TokenExpiredError,
    TraceTrailError,
    ValidationError,
)
from .http import HTTPClient

__version__ = "1.0.0"

__all__ = [
    "TraceTrail",
    "Auth",
    "Config",
    "HTTPClient",
    # Exceptions
    "TraceTrailError",
    "APIError",
    "AuthenticationError",
    "TokenExpiredError",
    "InvalidTokenError",
    "NotFoundError",
    "ValidationError",
    "RateLimitError",
    "ServerError",
    "ConnectionError",
    "TimeoutError",
]
