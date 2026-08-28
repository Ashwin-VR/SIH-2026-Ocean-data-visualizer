import numpy as np

from app.scientific import build_fixture_field, make_slice, make_volume, sample_field


def test_fixture_field_uses_positive_down_depth_and_expected_axes():
    field = build_fixture_field()
    assert field.depths[0] == 0
    assert np.all(np.diff(field.depths) > 0)
    assert field.values.shape == (len(field.depths), len(field.latitudes), len(field.longitudes))


def test_slice_lod_reduces_horizontal_resolution():
    field = build_fixture_field()
    full = make_slice(field, depth_index=0, lod=1)
    reduced = make_slice(field, depth_index=0, lod=2)
    assert reduced.shape[0] <= full.shape[0]
    assert reduced.shape[1] <= full.shape[1]
    assert len(reduced.values) == reduced.shape[0] * reduced.shape[1]


def test_volume_lod_has_consistent_flattened_shape():
    field = build_fixture_field()
    volume = make_volume(field, lod=2)
    assert len(volume.values) == np.prod(volume.shape)
    assert volume.shape[0] == len(volume.depth)


def test_sample_field_returns_interpolated_temperature():
    field = build_fixture_field()
    result = sample_field(field, lat=field.latitudes[1], lon=field.longitudes[1], depth=field.depths[1])
    assert result.value is not None
    assert result.interpolation == "trilinear"
