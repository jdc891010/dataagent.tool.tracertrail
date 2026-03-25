"""Base Pydantic model for TraceTrail entities."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TraceTrailBase(BaseModel):
    """Base model for all TraceTrail entities."""

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
        validate_assignment=True,
    )

    id: str | None = None
    created_date: datetime | None = None
    updated_date: datetime | None = None

    def to_dict(self, exclude_none: bool = True) -> dict[str, Any]:
        """Convert model to dictionary."""
        return self.model_dump(exclude_none=exclude_none, mode="json")
