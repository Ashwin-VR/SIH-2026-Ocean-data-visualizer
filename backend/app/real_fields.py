from __future__ import annotations
from pathlib import Path
import xarray as xr
from .ingestion import open_cf_scalar_field

DATA = Path(__file__).resolve().parents[2] / 'data' / 'incois'

def load_incois_vam(path: Path, variable: str, source_label: str):
    field = open_cf_scalar_field(path, variable)
    return field.__class__(
        variable=field.variable, units=field.units, depths=field.depths,
        latitudes=field.latitudes, longitudes=field.longitudes, values=field.values,
        valid_time=field.valid_time, source=source_label, product=field.product,
        dataset_id=field.dataset_id, cf_conventions=field.cf_conventions,
    )

def load_incois_fields():
    fields = {}
    t = DATA / 'incois_vam_temperature.nc'
    s = DATA / 'incois_vam_salinity.nc'
    if t.exists(): fields['temperature'] = load_incois_vam(t, 'TEMP', 'INCOIS · ARGO Monthly VAM')
    if s.exists(): fields['salinity'] = load_incois_vam(s, 'SAL', 'INCOIS · ARGO Monthly VAM')
    return fields

def load_incois_currents():
    p = DATA / 'incois_surface_currents.nc'
    if not p.exists(): return None
    ds = xr.open_dataset(p).load()
    import numpy as np
    u=np.asarray(ds['U'].values,dtype=np.float32); v=np.asarray(ds['V'].values,dtype=np.float32)
    u=np.where(np.isfinite(u),u,-9999.0); v=np.where(np.isfinite(v),v,-9999.0)
    return {
        'u':u, 'v':v,
        'latitudes':np.asarray(ds['LAT'].values,dtype=np.float32),
        'longitudes':np.asarray(ds['LON'].values,dtype=np.float32),
        'valid_time':str(ds['TAXIS'].values),
        'source':'INCOIS · Ocean State Forecast · surface currents',
    }
