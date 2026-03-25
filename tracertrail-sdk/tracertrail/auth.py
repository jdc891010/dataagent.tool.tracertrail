"""Authentication module with auto-refresh support."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from .http import HTTPClient
from .exceptions import AuthenticationError, TokenExpiredError


class Auth:
    """Handles authentication and token management."""

    def __init__(
        self,
        http_client: HTTPClient,
        api_key: str | None = None,
        access_token: str | None = None,
        token_expires_at: str | None = None,
        auto_refresh: bool = True,
        refresh_buffer: int = 300,
    ) -> None:
        self._http = http_client
        self._api_key = api_key
        self._access_token: str | None = access_token
        self._token_expires_at: datetime | None = None
        self._auto_refresh = auto_refresh
        self._refresh_buffer = refresh_buffer

        if token_expires_at:
            self._token_expires_at = datetime.fromisoformat(token_expires_at.replace("Z", "+00:00"))

        if api_key and not access_token:
            self._authenticate()
        elif access_token:
            self.set_token(access_token, token_expires_at)

    def _authenticate(self) -> None:
        """Authenticate using API key and obtain access token."""
        if not self._api_key:
            raise AuthenticationError("API key is required for authentication")

        response = self._http.post(
            "/auth/token/issue",
            json={"api_key": self._api_key},
        )

        data = response.json()
        self.set_token(
            access_token=data["access_token"],
            expires_at=data.get("expires_at"),
        )

    def set_token(self, access_token: str, expires_at: str | None = None) -> None:
        """Set the access token and its expiration time."""
        self._access_token = access_token
        self._http.set_header("Authorization", f"Bearer {access_token}")

        if expires_at:
            self._token_expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))

    def get_token(self) -> str:
        """Get the current access token, refreshing if necessary."""
        if not self._access_token:
            raise AuthenticationError("No access token available")

        if self._should_refresh():
            self.refresh()

        return self._access_token

    def _should_refresh(self) -> bool:
        """Check if the token should be refreshed."""
        if not self._auto_refresh:
            return False

        if not self._token_expires_at:
            return False

        now = datetime.now(self._token_expires_at.tzinfo)
        refresh_threshold = self._token_expires_at - timedelta(seconds=self._refresh_buffer)

        return now >= refresh_threshold

    def refresh(self) -> None:
        """Refresh the access token."""
        if not self._access_token:
            raise AuthenticationError("No access token to refresh")

        response = self._http.post(
            "/auth/token/refresh",
            json={"token": self._access_token},
        )

        data = response.json()
        self.set_token(
            access_token=data["access_token"],
            expires_at=data.get("expires_at"),
        )

    def ensure_valid_token(self) -> str:
        """Ensure we have a valid token, refreshing if needed."""
        return self.get_token()

    @property
    def is_authenticated(self) -> bool:
        """Check if we have a valid access token."""
        return self._access_token is not None

    @property
    def expires_at(self) -> datetime | None:
        """Get the token expiration time."""
        return self._token_expires_at

    @property
    def auto_refresh(self) -> bool:
        """Check if auto-refresh is enabled."""
        return self._auto_refresh

    @auto_refresh.setter
    def auto_refresh(self, value: bool) -> None:
        """Set auto-refresh behavior."""
        self._auto_refresh = value

    @property
    def refresh_buffer(self) -> int:
        """Get the refresh buffer in seconds."""
        return self._refresh_buffer

    @refresh_buffer.setter
    def refresh_buffer(self, value: int) -> None:
        """Set the refresh buffer in seconds."""
        self._refresh_buffer = value
