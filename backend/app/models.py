
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator

class APIErrorDetail(BaseModel):
    code: str; message: str; details: dict[str, Any] | None = None
class APIError(BaseModel): error: APIErrorDetail

class DatasetSummary(BaseModel):
    id: str; name: str; source: str; variables: list[str]; status: str

class FieldMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    variable: str; units: str; depths: list[float]; latitudes: list[float]; longitudes: list[float]
    source: str; product: str; dataset_id: str; retrieved_at: str; valid_time: str; cf_conventions: str
    @field_validator("depths")
    @classmethod
    def positive_down(cls,v):
        if any(x<0 for x in v): raise ValueError("depths must use positive-down metres")
        return v

class SliceResponse(BaseModel):
    variable: str; units: str; depth: float; shape: list[int]; values: list[float]
    latitude: list[float]; longitude: list[float]; missing_value: float; bounds: dict[str,float]

class VolumeResponse(BaseModel):
    variable: str; units: str; shape: list[int]; values: list[float]
    bounds: dict[str,float]; missing_value: float; depth: list[float]
    latitude: list[float]; longitude: list[float]; source: str = "unknown"; valid_time: str = "unknown"

class SampleResult(BaseModel):
    variable: str; units: str; value: float | None; interpolation: str; source_time: str
    latitude: float; longitude: float; depth: float

class ObservationMarker(BaseModel):
    platform: str; cycle: int; sensor: str; latitude: float; longitude: float
    timestamp: str; variables: list[str]

class ProfilePoint(BaseModel): depth: float; observed: float | None; salinity: float | None = None; qc: str | None = None
class ProfileResponse(BaseModel):
    platform: str; cycle: int; sensor: str; timestamp: str; latitude: float; longitude: float
    variable: str; units: str; points: list[ProfilePoint]

class ComparisonPoint(BaseModel):
    depth: float; observed: float | None; model: float | None; delta: float | None; qc: str | None
class ComparisonResponse(BaseModel):
    platform: str; cycle: int; variable: str; units: str; observation_timestamp: str
    model_valid_time: str; interpolation: str; points: list[ComparisonPoint]

class FieldCatalogItem(BaseModel):
    id: str; label: str; short: str; units: str; source: str; kind: str; color_min: float; color_max: float

class VectorFieldResponse(BaseModel):
    variable: str; units: str; shape: list[int]; u: list[float]; v: list[float]
    latitude: list[float]; longitude: list[float]; source: str; valid_time: str
