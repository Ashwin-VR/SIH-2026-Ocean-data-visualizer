import pytest
from pydantic import ValidationError

from app.models import FieldMetadata, VolumeResponse, ObservationMarker


def test_field_metadata_requires_positive_down_depths():
    metadata = FieldMetadata(
        variable="temperature", units="degC", depths=[0, 50, 100],
        latitudes=[0, 1], longitudes=[70, 71], source="fixture", product="demo",
        dataset_id="demo-temp", retrieved_at="2026-08-28T00:00:00Z", valid_time="2026-08-28T00:00:00Z",
        cf_conventions="CF-1.8"
    )
    assert metadata.depths == [0, 50, 100]

    with pytest.raises(ValidationError):
        FieldMetadata(
            variable="temperature", units="degC", depths=[0, -50],
            latitudes=[0], longitudes=[70], source="fixture", product="demo",
            dataset_id="demo", retrieved_at="2026-08-28T00:00:00Z", valid_time="2026-08-28T00:00:00Z",
            cf_conventions="CF-1.8"
        )


def test_volume_response_contains_flat_values_and_shape():
    response = VolumeResponse(
        variable="temperature", shape=[2, 2, 2], values=[1.0] * 8,
        bounds={"min": 1.0, "max": 1.0}, missing_value=-9999.0,
        depth=[0, 100], latitude=[10, 11], longitude=[70, 71]
    )
    assert response.shape == [2, 2, 2]
    assert len(response.values) == 8


def test_observation_marker_has_coordinates_and_identity():
    marker = ObservationMarker(
        platform="1902025", cycle=336, sensor="Argo", latitude=-3.4, longitude=49.9,
        timestamp="2026-01-01T07:58:42Z", variables=["temperature"]
    )
    assert marker.platform == "1902025"
