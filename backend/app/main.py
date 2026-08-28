from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .argo import fixture_profiles
from .models import APIError, APIErrorDetail, ComparisonResponse, DatasetSummary, FieldMetadata
from .scientific import build_fixture_field, make_slice, make_volume, metadata_dict, sample_field

app = FastAPI(title="SIH26067 Ocean Analysis API", version="0.1.0")
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return error_response(422, "VALIDATION_ERROR", "Request validation failed", {"errors": exc.errors()})


FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@app.get("/", include_in_schema=False)
def frontend_root():
    if FRONTEND_DIST.exists():
        return FileResponse(FRONTEND_DIST / "index.html")
    return JSONResponse({"service": "sih26067-ocean-api", "message": "Frontend build not present"}, status_code=503)


if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

FIELD = build_fixture_field()
PROFILES = {profile.platform + ":" + str(profile.cycle): profile for profile in fixture_profiles()}


def error_response(status: int, code: str, message: str, details: dict | None = None) -> JSONResponse:
    payload = APIError(error=APIErrorDetail(code=code, message=message, details=details))
    return JSONResponse(status_code=status, content=payload.model_dump())


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "sih26067-ocean-api", "version": app.version}


@app.get("/api/datasets", response_model=list[DatasetSummary])
def datasets() -> list[DatasetSummary]:
    return [DatasetSummary(
        id=FIELD.dataset_id,
        name="Indian Ocean Temperature Demo Field",
        source=FIELD.source,
        variables=["temperature"],
        status="fixture",
    )]


@app.get("/api/fields/{field_id}/metadata", response_model=FieldMetadata)
def field_metadata(field_id: str):
    if field_id != FIELD.dataset_id and field_id != "temperature":
        return error_response(404, "NOT_FOUND", "Field not found")
    return metadata_dict(FIELD)


@app.get("/api/fields/{field_id}/slice")
def field_slice(field_id: str, depth: float = Query(0, ge=0), lod: int = Query(1, ge=1, le=16)):
    if field_id not in {FIELD.dataset_id, "temperature"}:
        return error_response(404, "NOT_FOUND", "Field not found")
    depth_index = min(range(len(FIELD.depths)), key=lambda i: abs(float(FIELD.depths[i]) - depth))
    return make_slice(FIELD, depth_index, lod)


@app.get("/api/fields/{field_id}/volume")
def field_volume(field_id: str, lod: int = Query(2, ge=1, le=16)):
    if field_id not in {FIELD.dataset_id, "temperature"}:
        return error_response(404, "NOT_FOUND", "Field not found")
    return make_volume(FIELD, lod)


@app.get("/api/fields/{field_id}/point")
def field_point(
    field_id: str,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    depth: float = Query(..., ge=0),
):
    if field_id not in {FIELD.dataset_id, "temperature"}:
        return error_response(404, "NOT_FOUND", "Field not found")
    try:
        return sample_field(FIELD, lat=lat, lon=lon, depth=depth)
    except ValueError as exc:
        return error_response(422, "OUT_OF_BOUNDS", str(exc))


@app.get("/api/observations")
def observations():
    return [profile.marker() for profile in PROFILES.values()]


@app.get("/api/observations/{platform}/{cycle}/profile")
def profile(platform: str, cycle: int):
    item = PROFILES.get(f"{platform}:{cycle}")
    if item is None:
        return error_response(404, "NOT_FOUND", "Observation profile not found")
    return item.response()


@app.get("/api/comparisons/profile", response_model=ComparisonResponse)
def comparison(platform: str, cycle: int, field_id: str = "temperature"):
    item = PROFILES.get(f"{platform}:{cycle}")
    if item is None:
        return error_response(404, "NOT_FOUND", "Observation profile not found")
    if field_id not in {FIELD.dataset_id, "temperature"}:
        return error_response(404, "NOT_FOUND", "Field not found")

    points = []
    for observation in item.points:
        try:
            sample = sample_field(FIELD, item.latitude, item.longitude, observation.depth)
        except ValueError:
            sample = None
        model = sample.value if sample else None
        delta = model - observation.observed if model is not None and observation.observed is not None else None
        points.append({
            "depth": observation.depth,
            "observed": observation.observed,
            "model": model,
            "delta": delta,
            "qc": observation.qc,
        })

    return ComparisonResponse(
        platform=item.platform,
        cycle=item.cycle,
        variable=FIELD.variable,
        units=FIELD.units,
        observation_timestamp=item.timestamp,
        model_valid_time=FIELD.valid_time,
        interpolation="trilinear",
        points=points,
    )
