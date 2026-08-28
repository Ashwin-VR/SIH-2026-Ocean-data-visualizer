import numpy as np
import pytest

xr = pytest.importorskip("xarray")
from app.ingestion import open_cf_scalar_field


def test_open_cf_scalar_field_normalizes_common_cf_coordinates(tmp_path):
    path = tmp_path / "sample.nc"
    ds = xr.Dataset(
        {"thetao": (("depth", "latitude", "longitude"), np.ones((2, 2, 3), dtype=np.float32) * 25)},
        coords={"depth": [100, 0], "latitude": [1, 2], "longitude": [70, 71, 72]},
        attrs={"Conventions": "CF-1.8"},
    )
    ds.to_netcdf(path)
    field = open_cf_scalar_field(path, variable="thetao")
    assert field.variable == "temperature"
    assert field.depths.tolist() == [0.0, 100.0]
    assert field.values.shape == (2, 2, 3)
