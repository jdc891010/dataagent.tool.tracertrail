import pytest
import os

@pytest.fixture
def api_base_url():
    """
    Fixture to provide the base URL for the backend API.
    Defaults to the local development server URL (running via node server/app.js).
    Can be overridden by the TRACERTRAIL_API_URL environment variable.
    """
    return os.getenv("TRACERTRAIL_API_URL", "http://localhost:8081/api")
