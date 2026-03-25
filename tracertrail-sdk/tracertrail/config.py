"""Configuration for the TraceTrail SDK."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Config:
    """Configuration for the TraceTrail client."""

    api_url: str = "http://localhost:8081/api"
    timeout: float = 30.0
    auto_refresh: bool = True
    refresh_buffer: int = 300
    max_retries: int = 3

    def __post_init__(self) -> None:
        if not self.api_url.endswith("/api"):
            self.api_url = f"{self.api_url.rstrip('/')}/api"
