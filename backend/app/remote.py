from __future__ import annotations
from io import BytesIO
from functools import lru_cache
import os
import warnings
import requests
import numpy as np
import xarray as xr
from .scientific import ScalarField

BASE='https://erddap.incois.gov.in/erddap/griddap/incois_argo_mnt_VAM'
REMOTE_DEPTHS=(5.0,10.0,20.0,30.0,50.0,75.0,100.0,125.0,150.0,200.0,250.0,300.0,400.0,500.0,600.0,700.0,800.0,900.0,1000.0,1200.0,1400.0,1600.0,1800.0,2000.0)
VERIFY_TLS=os.getenv('INCOIS_VERIFY_TLS','0').lower() in {'1','true','yes'}

def _get(url:str):
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        r=requests.get(url,timeout=30,verify=VERIFY_TLS)
    r.raise_for_status(); return r.content

@lru_cache(maxsize=1)
def time_values():
    ds=xr.open_dataset(BytesIO(_get(f'{BASE}.nc?time')),engine='scipy')
    return tuple(str(np.datetime_as_string(v,unit='s'))+'Z' for v in ds.time.values)

@lru_cache(maxsize=64)
def fetch_slice(field:str,time_index:int,depth_index:int,lod:int=1):
    variable='TEMP' if field=='temperature' else 'SAL'
    depth_index=max(0,min(len(REMOTE_DEPTHS)-1,int(depth_index)))
    stride=max(1,int(lod))
    stop_lat=59; stop_lon=89
    url=f'{BASE}.nc?{variable}[{time_index}][{depth_index}][0:{stride}:{stop_lat}][0:{stride}:{stop_lon}]'
    ds=xr.open_dataset(BytesIO(_get(url)),engine='scipy')
    da=ds[variable]
    values=np.asarray(da.values,dtype=np.float32).reshape(-1)
    values=np.where(np.isfinite(values),values,-9999.0)
    lat=np.asarray(ds.latitude.values,dtype=np.float32)
    lon=np.asarray(ds.longitude.values,dtype=np.float32)
    return {
        'variable':'temperature' if field=='temperature' else 'salinity',
        'units':'degC' if field=='temperature' else 'PSU',
        'depth':REMOTE_DEPTHS[depth_index],
        'shape':[len(lat),len(lon)],
        'values':values.astype(float).tolist(),
        'latitude':lat.astype(float).tolist(),
        'longitude':lon.astype(float).tolist(),
        'missing_value':-9999.0,
        'bounds':{'min':float(np.min(values[values!=-9999.0])),'max':float(np.max(values[values!=-9999.0]))} if np.any(values!=-9999.0) else {'min':0.0,'max':1.0},
    }


@lru_cache(maxsize=64)
def fetch_cube(field:str,time_index:int,lat_min:float,lat_max:float,lon_min:float,lon_max:float,depth_stride:int=1,lat_stride:int=1,lon_stride:int=1):
    variable='TEMP' if field=='temperature' else 'SAL'
    # The INCOIS VAM grid is 1 degree in latitude/longitude over the published regional domain.
    # Convert geographic bounds to nearest grid indices, then request only the selected ROI.
    lat0=max(-29.5,min(29.5,round(lat_min)))
    lat1=max(-29.5,min(29.5,round(lat_max)))
    lon0=max(30.5,min(119.5,round(lon_min)))
    lon1=max(30.5,min(119.5,round(lon_max)))
    if lat1<lat0: lat0,lat1=lat1,lat0
    if lon1<lon0: lon0,lon1=lon1,lon0
    y0=int(round(lat0+29.5)); y1=int(round(lat1+29.5))
    x0=int(round(lon0-30.5)); x1=int(round(lon1-30.5))
    ds_i=max(1,int(depth_stride)); ys=max(1,int(lat_stride)); xs=max(1,int(lon_stride))
    url=f'{BASE}.nc?{variable}[{time_index}][0:{ds_i}:23][{y0}:{ys}:{y1}][{x0}:{xs}:{x1}]'
    ds=xr.open_dataset(BytesIO(_get(url)),engine='scipy'); da=ds[variable].isel(time=0)
    values=np.asarray(da.values,dtype=np.float32); values=np.where(np.isfinite(values),values,-9999.0)
    valid=values[values!=-9999.0]
    return {'variable':'temperature' if field=='temperature' else 'salinity','units':'degC' if field=='temperature' else 'PSU','shape':[values.shape[0],values.shape[1],values.shape[2]],'values':values.reshape(-1).astype(float).tolist(),'latitude':np.asarray(ds.latitude.values,dtype=float).tolist(),'longitude':np.asarray(ds.longitude.values,dtype=float).tolist(),'depth':np.asarray(ds.ZAX.values,dtype=float).tolist(),'missing_value':-9999.0,'bounds':{'min':float(valid.min()) if valid.size else 0.0,'max':float(valid.max()) if valid.size else 1.0},'source':'INCOIS · ARGO VAM · public ERDDAP griddap','valid_time':str(np.datetime_as_string(ds.time.values[0],unit='s'))+'Z'}

@lru_cache(maxsize=16)
def fetch_field(field:str,time_index:int=270):
    variable='TEMP' if field=='temperature' else 'SAL'
    url=f'{BASE}.nc?{variable}[{time_index}][0:23][0:59][0:89]'
    ds=xr.open_dataset(BytesIO(_get(url)),engine='scipy')
    da=ds[variable].isel(time=0)
    values=np.asarray(da.values,dtype=np.float32)
    values=np.where(np.isfinite(values),values,-9999.0)
    return ScalarField(variable='temperature' if field=='temperature' else 'salinity',units='degC' if field=='temperature' else 'PSU',depths=np.asarray(ds.ZAX.values,dtype=np.float32),latitudes=np.asarray(ds.latitude.values,dtype=np.float32),longitudes=np.asarray(ds.longitude.values,dtype=np.float32),values=values,valid_time=str(np.datetime_as_string(ds.time.values[0],unit='s'))+'Z',source='INCOIS · ARGO VAM · public ERDDAP griddap',product='INCOIS ARGO Monthly data Variational Analysis Methodology',dataset_id='incois_argo_mnt_VAM',cf_conventions=str(ds.attrs.get('Conventions','CF-1.6')))
