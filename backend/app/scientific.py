from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import numpy as np

from .models import SampleResult, SliceResponse, VolumeResponse


MISSING_VALUE = -9999.0


@dataclass(frozen=True)
class ScalarField:
    variable: str
    units: str
    depths: np.ndarray
    latitudes: np.ndarray
    longitudes: np.ndarray
    values: np.ndarray
    valid_time: str
    source: str = "SIH26067 deterministic demo fixture"
    product: str = "GLOBAL_ANALYSISFORECAST_PHY_001_024-shaped fixture"
    dataset_id: str = "demo-copernicus-temperature"
    cf_conventions: str = "CF-1.8"


def build_fixture_field() -> ScalarField:
    depths = np.array([0, 25, 50, 100, 200, 350, 500, 750, 1000], dtype=np.float32)
    latitudes = np.linspace(-5, 22, 54, dtype=np.float32)
    longitudes = np.linspace(45, 105, 121, dtype=np.float32)
    z = depths[:, None, None]
    y = latitudes[None, :, None]
    x = longitudes[None, None, :]
    surface = 28.8 - 0.055 * (y - 8.0) - 0.018 * (x - 80.0)
    thermocline = 7.5 * np.exp(-z / 150.0)
    basin_wave = 0.45 * np.sin(np.deg2rad(y * 7.0)) * np.cos(np.deg2rad(x * 4.0))
    values = (surface + thermocline + basin_wave - 0.0045 * z).astype(np.float32)
    return ScalarField(
        variable="temperature",
        units="degC",
        depths=depths,
        latitudes=latitudes,
        longitudes=longitudes,
        values=values,
        valid_time="2026-08-28T00:00:00Z",
    )


def _step_indices(size: int, lod: int) -> np.ndarray:
    if lod <= 1:
        return np.arange(size)
    return np.arange(0, size, max(1, lod))


def _bounds(values: np.ndarray) -> dict[str, float]:
    finite = values[np.isfinite(values) & (values != MISSING_VALUE)]
    return {"min": float(np.min(finite)), "max": float(np.max(finite))}


def make_slice(field: ScalarField, depth_index: int, lod: int = 1) -> SliceResponse:
    depth_index = max(0, min(depth_index, len(field.depths) - 1))
    yi = _step_indices(len(field.latitudes), lod)
    xi = _step_indices(len(field.longitudes), lod)
    values = field.values[depth_index][np.ix_(yi, xi)]
    return SliceResponse(
        variable=field.variable,
        depth=float(field.depths[depth_index]),
        shape=[len(yi), len(xi)],
        values=values.reshape(-1).astype(float).tolist(),
        latitude=field.latitudes[yi].astype(float).tolist(),
        longitude=field.longitudes[xi].astype(float).tolist(),
        missing_value=MISSING_VALUE,
        bounds=_bounds(values),
    )


def make_volume(field: ScalarField, lod: int = 1) -> VolumeResponse:
    zi = _step_indices(len(field.depths), lod)
    yi = _step_indices(len(field.latitudes), lod)
    xi = _step_indices(len(field.longitudes), lod)
    values = field.values[np.ix_(zi, yi, xi)]
    return VolumeResponse(
        variable=field.variable,
        shape=[len(zi), len(yi), len(xi)],
        values=values.reshape(-1).astype(float).tolist(),
        bounds=_bounds(values),
        missing_value=MISSING_VALUE,
        depth=field.depths[zi].astype(float).tolist(),
        latitude=field.latitudes[yi].astype(float).tolist(),
        longitude=field.longitudes[xi].astype(float).tolist(),
    )


def _bracket(axis: np.ndarray, value: float) -> tuple[int, int, float]:
    if value < float(axis[0]) or value > float(axis[-1]):
        raise ValueError("coordinate is outside field bounds")
    hi = int(np.searchsorted(axis, value, side="right"))
    if hi == 0:
        return 0, 0, 0.0
    if hi >= len(axis):
        last = len(axis) - 1
        return last, last, 0.0
    lo = hi - 1
    span = float(axis[hi] - axis[lo])
    weight = 0.0 if span == 0 else (value - float(axis[lo])) / span
    return lo, hi, weight


def sample_field(field: ScalarField, lat: float, lon: float, depth: float) -> SampleResult:
    z0, z1, wz = _bracket(field.depths, depth)
    y0, y1, wy = _bracket(field.latitudes, lat)
    x0, x1, wx = _bracket(field.longitudes, lon)
    cube = field.values[np.ix_([z0, z1], [y0, y1], [x0, x1])].astype(float)
    weights_z = np.array([1 - wz, wz])
    weights_y = np.array([1 - wy, wy])
    weights_x = np.array([1 - wx, wx])
    value = float(np.einsum("i,j,k,ijk->", weights_z, weights_y, weights_x, cube))
    return SampleResult(
        variable=field.variable,
        value=None if not np.isfinite(value) or value == MISSING_VALUE else value,
        interpolation="trilinear",
        source_time=field.valid_time,
        latitude=lat,
        longitude=lon,
        depth=depth,
    )


def metadata_dict(field: ScalarField) -> dict:
    return {
        "variable": field.variable,
        "units": field.units,
        "depths": field.depths.astype(float).tolist(),
        "latitudes": field.latitudes.astype(float).tolist(),
        "longitudes": field.longitudes.astype(float).tolist(),
        "source": field.source,
        "product": field.product,
        "dataset_id": field.dataset_id,
        "retrieved_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "valid_time": field.valid_time,
        "cf_conventions": field.cf_conventions,
    }
