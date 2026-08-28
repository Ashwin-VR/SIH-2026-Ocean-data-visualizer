
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import numpy as np
from .models import SampleResult, SliceResponse, VolumeResponse
MISSING=-9999.0
@dataclass(frozen=True)
class ScalarField:
    variable:str; units:str; depths:np.ndarray; latitudes:np.ndarray; longitudes:np.ndarray; values:np.ndarray
    valid_time:str; source:str; product:str; dataset_id:str; cf_conventions:str='CF-1.8'

def _indices(n,lod): return np.arange(n) if lod<=1 else np.arange(0,n,max(1,lod))
def bounds(v):
    a=v[np.isfinite(v)&(v!=MISSING)]
    return {'min':float(np.min(a)),'max':float(np.max(a))} if a.size else {'min':0.0,'max':1.0}
def subset_field(f, lat_min=None, lat_max=None, lon_min=None, lon_max=None, depth_min=None, depth_max=None, lat_stride=1, lon_stride=1, depth_stride=1):
    def idx(a,lo,hi,stride):
        mask=np.ones(len(a),dtype=bool)
        if lo is not None: mask &= a >= lo
        if hi is not None: mask &= a <= hi
        ids=np.flatnonzero(mask)[::max(1,stride)]
        return ids if len(ids) else np.arange(len(a))[::max(1,stride)]
    zi=idx(f.depths,depth_min,depth_max,depth_stride); yi=idx(f.latitudes,lat_min,lat_max,lat_stride); xi=idx(f.longitudes,lon_min,lon_max,lon_stride)
    return ScalarField(f.variable,f.units,f.depths[zi],f.latitudes[yi],f.longitudes[xi],f.values[np.ix_(zi,yi,xi)],f.valid_time,f.source,f.product,f.dataset_id,f.cf_conventions)

def make_slice(f,depth_index,lod=1):
    depth_index=max(0,min(depth_index,len(f.depths)-1)); yi=_indices(len(f.latitudes),lod); xi=_indices(len(f.longitudes),lod); v=f.values[depth_index][np.ix_(yi,xi)]
    return SliceResponse(variable=f.variable,units=f.units,depth=float(f.depths[depth_index]),shape=[len(yi),len(xi)],values=v.reshape(-1).astype(float).tolist(),latitude=f.latitudes[yi].astype(float).tolist(),longitude=f.longitudes[xi].astype(float).tolist(),missing_value=MISSING,bounds=bounds(v))
def make_volume(f,lod=1):
    zi=_indices(len(f.depths),lod); yi=_indices(len(f.latitudes),lod); xi=_indices(len(f.longitudes),lod); v=f.values[np.ix_(zi,yi,xi)]
    return VolumeResponse(variable=f.variable,units=f.units,shape=[len(zi),len(yi),len(xi)],values=v.reshape(-1).astype(float).tolist(),bounds=bounds(v),missing_value=MISSING,depth=f.depths[zi].astype(float).tolist(),latitude=f.latitudes[yi].astype(float).tolist(),longitude=f.longitudes[xi].astype(float).tolist(),source=f.source,valid_time=f.valid_time)
def bracket(a,x):
    if x<a[0] or x>a[-1]: raise ValueError('coordinate outside field bounds')
    hi=int(np.searchsorted(a,x,side='right'))
    if hi==0:return 0,0,0
    if hi>=len(a): i=len(a)-1;return i,i,0
    lo=hi-1; span=float(a[hi]-a[lo]); return lo,hi,0 if span==0 else (x-float(a[lo]))/span
def sample_field(f,lat,lon,depth):
    z0,z1,wz=bracket(f.depths,depth); y0,y1,wy=bracket(f.latitudes,lat); x0,x1,wx=bracket(f.longitudes,lon)
    c=f.values[np.ix_([z0,z1],[y0,y1],[x0,x1])].astype(float)
    v=float(np.einsum('i,j,k,ijk->',np.array([1-wz,wz]),np.array([1-wy,wy]),np.array([1-wx,wx]),c))
    return SampleResult(variable=f.variable,units=f.units,value=None if not np.isfinite(v) or v==MISSING else v,interpolation='trilinear',source_time=f.valid_time,latitude=lat,longitude=lon,depth=depth)
def metadata(f):
    return {'variable':f.variable,'units':f.units,'depths':f.depths.astype(float).tolist(),'latitudes':f.latitudes.astype(float).tolist(),'longitudes':f.longitudes.astype(float).tolist(),'source':f.source,'product':f.product,'dataset_id':f.dataset_id,'retrieved_at':datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),'valid_time':f.valid_time,'cf_conventions':f.cf_conventions}
