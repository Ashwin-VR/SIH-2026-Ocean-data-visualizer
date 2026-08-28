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
