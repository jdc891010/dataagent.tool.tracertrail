"""Tests for package initialization."""
import tracertrail


def test_package_version():
    """Test that package version is defined."""
    assert tracertrail.__version__ is not None
    assert isinstance(tracertrail.__version__, str)


def test_package_exports():
    """Test that package exports are available."""
    assert hasattr(tracertrail, 'TraceTrail')
