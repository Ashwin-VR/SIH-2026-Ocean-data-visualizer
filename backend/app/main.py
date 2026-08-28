from __future__ import annotations
from fastapi import FastAPI, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .argo import fetch_argo_profile, fetch_surface_markers
from .models import *
from .scientific import make_slice, make_volume, metadata, sample_field
from .real_fields import load_incois_fields, load_incois_currents
from .remote import fetch_field as fetch_remote_field, time_values

app=FastAPI(title='SIH26067 Ocean Analysis API',version='0.3.0')
FRONTEND_DIST=Path(__file__).resolve().parents[2]/'frontend'/'dist'
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_credentials=False,allow_methods=['*'],allow_headers=['*'])

def error_response(status,code,message,details=None):
    return JSONResponse(status_code=status,content=APIError(error=APIErrorDetail(code=code,message=message,details=details)).model_dump())

@app.exception_handler(RequestValidationError)
async def validation(request,exc): return error_response(422,'VALIDATION_ERROR','Request validation failed',{'errors':exc.errors()})

if FRONTEND_DIST.exists(): app.mount('/assets',StaticFiles(directory=FRONTEND_DIST/'assets'),name='assets')

FIELDS=load_incois_fields()
CURRENT_FIELD=load_incois_currents()
ARGO=[]
try: ARGO=fetch_surface_markers(timeout=20)
except Exception: ARGO=[]

CATALOG=[]
if 'temperature' in FIELDS: CATALOG.append(FieldCatalogItem(id='temperature',label='Temperature',short='TEMP',units='°C',source='INCOIS · ARGO Monthly VAM',kind='3D analysis',color_min=10,color_max=32))
if 'salinity' in FIELDS: CATALOG.append(FieldCatalogItem(id='salinity',label='Salinity',short='SAL',units='PSU',source='INCOIS · ARGO Monthly VAM',kind='3D analysis',color_min=32,color_max=37))
if CURRENT_FIELD is not None: CATALOG.append(FieldCatalogItem(id='currents',label='Surface Currents',short='UV',units='m s⁻¹',source='INCOIS · Ocean State Forecast',kind='vector field',color_min=0,color_max=1))

@app.get('/',include_in_schema=False)
def root(): return FileResponse(FRONTEND_DIST/'index.html') if FRONTEND_DIST.exists() else JSONResponse({'service':'sih26067-ocean-api'},503)

@app.get('/api/health')
def health(): return {'status':'ok','service':'sih26067-ocean-api','version':app.version,'real_fields':list(FIELDS),'argo_markers':len(ARGO),'sources':{'incois_vam':bool(FIELDS),'incois_currents':CURRENT_FIELD is not None}}

@app.get('/api/fields',response_model=list[FieldCatalogItem])
def fields(): return CATALOG

def resolve_field(field_id: str, time_index: int | None = None):
    if time_index is not None and field_id in {'temperature','salinity'}:
        try: return fetch_remote_field(field_id, time_index)
        except Exception: pass
    return FIELDS.get(field_id)

@app.get('/api/fields/{field_id}/times')
def field_times(field_id):
    if field_id not in {'temperature','salinity'}: return [None]
    try: return list(time_values())
    except Exception:
        f=FIELDS.get(field_id); return [f.valid_time] if f else []

@app.get('/api/fields/{field_id}/metadata',response_model=FieldMetadata)
def field_metadata(field_id):
    f=FIELDS.get(field_id)
    if not f:return error_response(404,'FIELD_UNAVAILABLE','Field is unavailable')
    return metadata(f)

@app.get('/api/fields/{field_id}/slice')
def field_slice(field_id,depth:float=Query(0,ge=0),lod:int=Query(1,ge=1,le=16),time_index:int|None=Query(None,ge=0)):
    f=resolve_field(field_id,time_index)
    if not f:return error_response(404,'FIELD_UNAVAILABLE','Field is unavailable')
    i=min(range(len(f.depths)),key=lambda j:abs(float(f.depths[j])-depth)); return make_slice(f,i,lod)

@app.get('/api/fields/{field_id}/volume')
def field_volume(field_id,lod:int=Query(2,ge=1,le=16),time_index:int|None=Query(None,ge=0)):
    f=resolve_field(field_id,time_index)
    if not f:return error_response(404,'FIELD_UNAVAILABLE','Field is unavailable')
    return make_volume(f,lod)

@app.get('/api/fields/currents/vector', response_model=VectorFieldResponse)
def current_vectors():
    if CURRENT_FIELD is None: return error_response(404,'FIELD_UNAVAILABLE','INCOIS current field unavailable')
    return VectorFieldResponse(variable='surface_current',units='m s-1',shape=[len(CURRENT_FIELD['latitudes']),len(CURRENT_FIELD['longitudes'])],u=CURRENT_FIELD['u'].reshape(-1).astype(float).tolist(),v=CURRENT_FIELD['v'].reshape(-1).astype(float).tolist(),latitude=CURRENT_FIELD['latitudes'].astype(float).tolist(),longitude=CURRENT_FIELD['longitudes'].astype(float).tolist(),source=CURRENT_FIELD['source'],valid_time=CURRENT_FIELD['valid_time'])

@app.get('/api/fields/{field_id}/point')
def field_point(field_id,lat:float=Query(...,ge=-90,le=90),lon:float=Query(...,ge=-180,le=180),depth:float=Query(0,ge=0),time_index:int|None=Query(None,ge=0)):
    f=resolve_field(field_id,time_index)
    if not f:return error_response(404,'FIELD_UNAVAILABLE','Field is unavailable')
    try:return sample_field(f,lat,lon,depth)
    except ValueError as e:return error_response(422,'OUT_OF_BOUNDS',str(e))

@app.get('/api/observations',response_model=list[ObservationMarker])
def observations(): return [p.marker() for p in ARGO]

@app.get('/api/observations/{platform}/{cycle}/profile',response_model=ProfileResponse)
def profile(platform,cycle):
    try:return fetch_argo_profile(platform,cycle).response()
    except Exception as e:return error_response(404,'OBSERVATION_UNAVAILABLE',str(e))

@app.get('/api/comparisons/profile')
def comparison(platform,cycle,field_id='temperature'):
    try:p=fetch_argo_profile(platform,cycle)
    except Exception as e:return error_response(404,'OBSERVATION_UNAVAILABLE',str(e))
    f=FIELDS.get(field_id)
    if not f:return error_response(404,'FIELD_UNAVAILABLE','Comparison field unavailable')
    pts=[]
    for o in p.points:
        observed=o.salinity if field_id=='salinity' else o.observed
        if observed is None: continue
        try:model=sample_field(f,p.latitude,p.longitude,min(o.depth,float(f.depths[-1]))).value
        except Exception:model=None
        pts.append({'depth':o.depth,'observed':observed,'model':model,'delta':None if model is None else model-observed,'qc':o.qc})
    return ComparisonResponse(platform=p.platform,cycle=p.cycle,variable=f.variable,units=f.units,observation_timestamp=p.timestamp,model_valid_time=f.valid_time,interpolation='trilinear',points=pts)
