import numpy as np
from app.scientific import ScalarField, make_slice, make_volume, sample_field

def tiny_field():
    depths=np.array([0,50,100],dtype=np.float32); lat=np.array([0,1,2],dtype=np.float32); lon=np.array([40,41,42],dtype=np.float32)
    z=depths[:,None,None]; y=lat[None,:,None]; x=lon[None,None,:]
    values=(28-z*.02+y*.1+x*.01).astype(np.float32)
    return ScalarField('temperature','degC',depths,lat,lon,values,'test','unit test','test','test')

def test_scalar_field_uses_positive_down_depth_and_expected_axes():
    field=tiny_field(); assert field.depths[0]==0; assert np.all(np.diff(field.depths)>0); assert field.values.shape==(3,3,3)

def test_slice_lod_reduces_horizontal_resolution():
    field=tiny_field(); full=make_slice(field,0,1); reduced=make_slice(field,0,2); assert reduced.shape[0]<=full.shape[0]; assert reduced.shape[1]<=full.shape[1]

def test_volume_lod_has_consistent_flattened_shape():
    field=tiny_field(); volume=make_volume(field,2); assert len(volume.values)==np.prod(volume.shape); assert volume.shape[0]==len(volume.depth)

def test_sample_field_returns_interpolated_temperature():
    field=tiny_field(); result=sample_field(field,1,41,50); assert result.value is not None; assert result.interpolation=='trilinear'
