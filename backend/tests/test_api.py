from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_and_dataset_catalog():
    assert client.get("/api/health").status_code == 200
    response = client.get("/api/datasets")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "demo-copernicus-temperature"


def test_slice_and_volume_have_renderable_payloads():
    slice_response = client.get("/api/fields/temperature/slice?depth=100&lod=4")
    assert slice_response.status_code == 200
    body = slice_response.json()
    assert body["depth"] == 100
    assert len(body["values"]) == body["shape"][0] * body["shape"][1]

    volume_response = client.get("/api/fields/temperature/volume?lod=4")
    assert volume_response.status_code == 200
    volume = volume_response.json()
    assert len(volume["values"]) == volume["shape"][0] * volume["shape"][1] * volume["shape"][2]


def test_observation_profile_and_model_comparison():
    observations = client.get("/api/observations").json()
    assert observations[0]["platform"] == "1902025"
    profile = client.get("/api/observations/1902025/336/profile")
    assert profile.status_code == 200
    assert len(profile.json()["points"]) >= 10

    comparison = client.get("/api/comparisons/profile?platform=1902025&cycle=336&field_id=temperature")
    assert comparison.status_code == 200
    body = comparison.json()
    assert body["interpolation"] == "trilinear"
    assert any(point["delta"] is not None for point in body["points"])


def test_invalid_depth_is_structured_client_error():
    response = client.get("/api/fields/temperature/slice?depth=-1")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"

def test_root_serves_built_frontend_when_available():
    response = client.get("/")
    assert response.status_code == 200
    assert "Ocean Analysis Console" in response.text
