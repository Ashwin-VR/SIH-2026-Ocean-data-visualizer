from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)

def test_health_and_catalog():
    h=client.get('/api/health'); assert h.status_code==200
    r=client.get('/api/fields'); assert r.status_code==200
    ids={x['id'] for x in r.json()}
    assert {'temperature','salinity'} <= ids
    assert 'currents' in ids

def test_real_scalar_field_payloads():
    for field in ('temperature','salinity'):
        r=client.get(f'/api/fields/{field}/slice?depth=100&lod=2')
        assert r.status_code==200
        b=r.json(); assert len(b['values'])==b['shape'][0]*b['shape'][1]
        assert b['missing_value']==-9999.0

def test_real_current_vector_payload():
    r=client.get('/api/fields/currents/vector'); assert r.status_code==200
    b=r.json(); assert b['shape'][0]>10 and b['shape'][1]>10
    assert len(b['u'])==b['shape'][0]*b['shape'][1]
    assert len(b['v'])==len(b['u'])

def test_live_argo_contract():
    r=client.get('/api/observations'); assert r.status_code==200

def test_ogc_wcs_capabilities_and_coverage():
    r=client.get('/ogc/wcs?service=WCS&request=GetCapabilities&version=2.0.1')
    assert r.status_code==200 and 'WCS' in r.text and 'temperature' in r.text
    r=client.get('/ogc/wcs?service=WCS&request=DescribeCoverage&version=2.0.1&coverageId=temperature')
    assert r.status_code==200 and 'CoverageDescription' in r.text
    r=client.get('/ogc/wcs?service=WCS&request=GetCoverage&version=2.0.1&coverageId=temperature&subset=depth(0,200)&subset=latitude(5,15)&subset=longitude(70,90)')
    assert r.status_code==200 and r.headers['content-type'].startswith('application/x-netcdf')
    assert len(r.content)>1000

def test_ogc_wms_capabilities_and_map():
    r=client.get('/ogc/wms?service=WMS&request=GetCapabilities&version=1.3.0')
    assert r.status_code==200 and 'WMS_Capabilities' in r.text and 'temperature' in r.text
    r=client.get('/ogc/wms?service=WMS&request=GetMap&version=1.3.0&layers=temperature&crs=EPSG:4326&bbox=5,70,15,90&width=128&height=64&format=image/png')
    assert r.status_code==200 and r.headers['content-type'].startswith('image/png') and r.content[:8]==b'\x89PNG\r\n\x1a\n'

def test_ogc_wcs_capabilities_and_coverage():
    r=client.get('/ogc/wcs?service=WCS&request=GetCapabilities&version=2.0.1')
    assert r.status_code==200 and 'WCS' in r.text and 'temperature' in r.text
    r=client.get('/ogc/wcs?service=WCS&request=DescribeCoverage&version=2.0.1&coverageId=temperature')
    assert r.status_code==200 and 'CoverageDescription' in r.text
    r=client.get('/ogc/wcs?service=WCS&request=GetCoverage&version=2.0.1&coverageId=temperature&subset=depth(0,200)&subset=latitude(5,15)&subset=longitude(70,90)')
    assert r.status_code==200 and r.headers['content-type'].startswith('application/x-netcdf')
    assert len(r.content)>1000

def test_ogc_wms_capabilities_and_map():
    r=client.get('/ogc/wms?service=WMS&request=GetCapabilities&version=1.3.0')
    assert r.status_code==200 and 'WMS_Capabilities' in r.text and 'temperature' in r.text
    r=client.get('/ogc/wms?service=WMS&request=GetMap&version=1.3.0&layers=temperature&crs=EPSG:4326&bbox=5,70,15,90&width=128&height=64&format=image/png')
    assert r.status_code==200 and r.headers['content-type'].startswith('image/png') and r.content[:8]==b'\x89PNG\r\n\x1a\n'

def test_ogc_wcs_capabilities_and_coverage():
    r=client.get('/ogc/wcs?service=WCS&request=GetCapabilities&version=2.0.1')
    assert r.status_code==200 and 'WCS' in r.text and 'temperature' in r.text
    r=client.get('/ogc/wcs?service=WCS&request=DescribeCoverage&version=2.0.1&coverageId=temperature')
    assert r.status_code==200 and 'CoverageDescription' in r.text
    r=client.get('/ogc/wcs?service=WCS&request=GetCoverage&version=2.0.1&coverageId=temperature&subset=depth(0,200)&subset=latitude(5,15)&subset=longitude(70,90)')
    assert r.status_code==200 and r.headers['content-type'].startswith('application/x-netcdf')
    assert len(r.content)>1000

def test_ogc_wms_capabilities_and_map():
    r=client.get('/ogc/wms?service=WMS&request=GetCapabilities&version=1.3.0')
    assert r.status_code==200 and 'WMS_Capabilities' in r.text and 'temperature' in r.text
    r=client.get('/ogc/wms?service=WMS&request=GetMap&version=1.3.0&layers=temperature&crs=EPSG:4326&bbox=5,70,15,90&width=128&height=64&format=image/png')
    assert r.status_code==200 and r.headers['content-type'].startswith('image/png') and r.content[:8]==b'\x89PNG\r\n\x1a\n'
