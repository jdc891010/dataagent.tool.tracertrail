"""Pydantic models for TraceTrail entities."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from .base import TraceTrailBase


class Project(TraceTrailBase):
    """Project model."""

    name: str = Field(..., min_length=1, description="Project name")
    description: str = Field(default="", description="Project description")
    client: str | None = Field(default=None, description="Client name")
    status: str = Field(default="active", description="Project status")
    classification: str | None = Field(default=None, description="Governance classification")
    owner: str | None = Field(default=None, description="Project owner")
    data_steward: str | None = Field(default=None, description="Data steward")
    tags: list[str] = Field(default_factory=list, description="Project tags")
    requirements: list[str] = Field(default_factory=list, description="Compliance requirements")


class Dataset(TraceTrailBase):
    """Dataset model."""

    name: str = Field(..., min_length=1, description="Dataset name")
    project_id: str | None = Field(default=None, description="Parent project ID")
    description: str = Field(default="", description="Dataset description")
    source_system: str | None = Field(default=None, description="Source system")
    source_type: str | None = Field(default=None, description="Source type (database, file, api, stream, warehouse, lake)")
    refresh_frequency: str | None = Field(default=None, description="Refresh frequency")
    governance_classification: str | None = Field(default=None, description="Governance classification")
    contains_pii: bool = Field(default=False, description="Contains PII")
    retention_period: str | None = Field(default=None, description="Retention period")
    status: str = Field(default="active", description="Dataset status")
    tags: list[str] = Field(default_factory=list, description="Dataset tags")


class DataSource(TraceTrailBase):
    """DataSource model."""

    name: str = Field(..., min_length=1, description="Data source name")
    project_id: str | None = Field(default=None, description="Parent project ID")
    type: str = Field(default="api", description="Data source type (api, file, stream, database, warehouse)")
    status: str = Field(default="idle", description="Data source status")
    source_location: str | None = Field(default=None, description="Source location")
    target_location: str | None = Field(default=None, description="Target location")
    phase: str | None = Field(default=None, description="Processing phase")
    quality_score: float | None = Field(default=None, description="Quality score (0-100)")
    completeness_score: float | None = Field(default=None, description="Completeness score (0-100)")
    accuracy_score: float | None = Field(default=None, description="Accuracy score (0-100)")
    records_processed: int | None = Field(default=None, description="Records processed")
    records_failed: int | None = Field(default=None, description="Records failed")
    file_size: str | None = Field(default=None, description="File size")
    row_count: int | None = Field(default=None, description="Row count")
    column_count: int | None = Field(default=None, description="Column count")


class Issue(TraceTrailBase):
    """Issue model."""

    title: str = Field(..., min_length=1, description="Issue title")
    description: str = Field(default="", description="Issue description")
    data_source_id: str | None = Field(default=None, description="Related data source ID")
    issue_type: str | None = Field(default=None, description="Issue type")
    severity: str = Field(default="medium", description="Severity (low, medium, high, critical)")
    status: str = Field(default="open", description="Status (open, in_progress, resolved, closed)")
    assigned_to: str | None = Field(default=None, description="Assigned user")
    file: str | None = Field(default=None, description="Related file")
    dataset: str | None = Field(default=None, description="Related dataset")
    root_cause: str | None = Field(default=None, description="Root cause")
    impact_description: str | None = Field(default=None, description="Impact description")
    rows_affected: int | None = Field(default=None, description="Number of rows affected")
    tags: list[str] = Field(default_factory=list, description="Issue tags")


class VaultSolution(TraceTrailBase):
    """Vault Solution model."""

    title: str = Field(..., min_length=1, description="Solution title")
    description: str = Field(default="", description="Solution description")
    category: str | None = Field(default=None, description="Solution category")
    tags: list[str] = Field(default_factory=list, description="Solution tags")
    code_snippet: str = Field(..., description="Code snippet")
    language: str = Field(default="sql", description="Programming language")
    usage_count: int = Field(default=0, description="Number of times used")
    author: str | None = Field(default=None, description="Solution author")


class ProcessingRun(TraceTrailBase):
    """Processing Run model."""

    data_source_id: str | None = Field(default=None, description="Related data source ID")
    status: str = Field(default="pending", description="Run status (pending, in_progress, completed, failed)")
    started_at: datetime | None = Field(default=None, description="Run start time")
    finished_at: datetime | None = Field(default=None, description="Run finish time")
    duration_ms: int | None = Field(default=None, description="Duration in milliseconds")
    records_processed: int | None = Field(default=None, description="Records processed")
    records_failed: int | None = Field(default=None, description="Records failed")


class ApiKey(BaseModel):
    """API Key model."""

    id: str
    name: str
    permissions: dict[str, Any] | None = None
    rate_limit: int = 100
    is_active: bool = True
    last_used_at: datetime | None = None
    created_date: datetime
    expires_at: datetime | None = None


class TokenResponse(BaseModel):
    """Token response model."""

    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    expires_at: datetime | None = None


class HealthStatus(BaseModel):
    """Health status model."""

    status: str
    timestamp: datetime
    database: str


class SystemStats(BaseModel):
    """System statistics model."""

    projects: int = 0
    datasets: int = 0
    data_sources: int = 0
    issues: int = 0
    vault_solutions: int = 0
    processing_runs: int = 0
