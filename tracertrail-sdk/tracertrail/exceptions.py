"""Custom exceptions for the TraceTrail SDK."""


class TraceTrailError(Exception):
    """Base exception for TraceTrail SDK."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthenticationError(TraceTrailError):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(message, status_code=401)


class TokenExpiredError(AuthenticationError):
    """Raised when the access token has expired."""

    def __init__(self, message: str = "Access token has expired") -> None:
        super().__init__(message)


class InvalidTokenError(AuthenticationError):
    """Raised when the access token is invalid."""

    def __init__(self, message: str = "Invalid access token") -> None:
        super().__init__(message)


class APIError(TraceTrailError):
    """Raised when an API request fails."""

    def __init__(self, message: str, status_code: int, response: dict | None = None) -> None:
        super().__init__(message, status_code)
        self.response = response


class NotFoundError(APIError):
    """Raised when a resource is not found."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class ValidationError(APIError):
    """Raised when request validation fails."""

    def __init__(self, message: str, response: dict | None = None) -> None:
        super().__init__(message, status_code=400, response=response)


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: int | None = None) -> None:
        super().__init__(message, status_code=429)
        self.retry_after = retry_after


class ServerError(APIError):
    """Raised when the server returns an error."""

    def __init__(self, message: str = "Internal server error") -> None:
        super().__init__(message, status_code=500)


class ConnectionError(TraceTrailError):
    """Raised when connection to the API fails."""

    def __init__(self, message: str = "Failed to connect to TraceTrail API") -> None:
        super().__init__(message)


class TimeoutError(TraceTrailError):
    """Raised when a request times out."""

    def __init__(self, message: str = "Request timed out") -> None:
        super().__init__(message)
