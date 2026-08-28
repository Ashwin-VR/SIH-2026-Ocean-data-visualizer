from __future__ import annotations

from pathlib import Path

import numpy as np

from .scientific import ScalarField

VARIABLE_ALIASES = {
    "thetao": ("temperature", "degC"),
    "temp": ("temperature", "degC"),
    "so": ("salinity", "PSU"),
    "psal": ("salinity", "PSU"),
    "TEMP": ("temperature", "degC"),
    "SAL": ("salinity", "PSU"),
    "uo": ("uo", "m s-1"),
    "vo": ("vo", "m s-1"),
}


def open_cf_scalar_field(path: str | Path, variable: str) -> ScalarField:
    try:
        import xarray as xr
    except ImportError as exc:
        raise RuntimeError("xarray is required for NetCDF ingestion; install backend[science]") from exc

    with xr.open_dataset(path) as dataset:
        if variable not in dataset.data_vars:
            raise ValueError(f"variable {variable!r} not present in dataset")
        data = dataset[variable].squeeze(drop=True)
        aliases = VARIABLE_ALIASES.get(variable, (variable, str(data.attrs.get("units", ""))))
        dims = {dimension.lower(): dimension for dimension in data.dims}
        depth_dim = next((dims[key] for key in ("depth", "pres", "lev", "z", "zax") if key in dims), None)
        lat_dim = next((dims[key] for key in ("latitude", "lat") if key in dims), None)
        lon_dim = next((dims[key] for key in ("longitude", "lon") if key in dims), None)
        if not all((depth_dim, lat_dim, lon_dim)):
            raise ValueError("CF scalar field must expose depth, latitude and longitude dimensions")
        data = data.transpose(depth_dim, lat_dim, lon_dim)
        depths = np.asarray(dataset[depth_dim].values, dtype=np.float32)
        latitudes = np.asarray(dataset[lat_dim].values, dtype=np.float32)
        longitudes = np.asarray(dataset[lon_dim].values, dtype=np.float32)
        values = np.asarray(data.values, dtype=np.float32)
        values = np.where(np.isfinite(values), values, -9999.0).astype(np.float32)
        if depths.size and depths[0] > depths[-1]:
            depths = depths[::-1]
            values = values[::-1, :, :]
        if np.any(depths < 0):
            depths = np.abs(depths)
        if "time" in dataset.coords:
            tv = dataset["time"].values
            valid_time = str(tv.reshape(-1)[0]) if getattr(tv, "size", 0) else "unknown"
        else:
            valid_time = "unknown"
        return ScalarField(
            variable=aliases[0], units=aliases[1], depths=depths, latitudes=latitudes,
            longitudes=longitudes, values=values, valid_time=valid_time,
            source=str(dataset.attrs.get("institution", "NetCDF source")),
            product=str(dataset.attrs.get("title", Path(path).name)),
            dataset_id=str(Path(path).stem),
            cf_conventions=str(dataset.attrs.get("Conventions", "unknown")),
        )
