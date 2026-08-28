from __future__ import annotations

import csv
import io
import httpx
from urllib.parse import quote
from dataclasses import dataclass
from math import isfinite
from pathlib import Path

from .models import ObservationMarker, ProfilePoint, ProfileResponse


@dataclass(frozen=True)
class ArgoProfile:
    platform: str
    cycle: int
    timestamp: str
    latitude: float
    longitude: float
    points: list[ProfilePoint]
    sensor: str = "Argo"
    variable: str = "temperature"
    units: str = "degC"

    def marker(self) -> ObservationMarker:
        return ObservationMarker(
            platform=self.platform,
            cycle=self.cycle,
            sensor=self.sensor,
            latitude=self.latitude,
            longitude=self.longitude,
            timestamp=self.timestamp,
            variables=[self.variable],
        )

    def response(self) -> ProfileResponse:
        return ProfileResponse(
            platform=self.platform,
            cycle=self.cycle,
            sensor=self.sensor,
            timestamp=self.timestamp,
            latitude=self.latitude,
            longitude=self.longitude,
            variable=self.variable,
            units=self.units,
            points=self.points,
        )


def _number(value: str) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if isfinite(parsed) else None


def parse_argo_csv(text: str) -> list[ArgoProfile]:
    rows = list(csv.DictReader(io.StringIO(text)))
    grouped: dict[tuple[str, int], list[dict[str, str]]] = {}
    for row in rows:
        if not row.get("platform_number") or not row.get("cycle_number"):
            continue
        key = (row["platform_number"].strip(), int(float(row["cycle_number"])))
        grouped.setdefault(key, []).append(row)

    profiles: list[ArgoProfile] = []
    for (platform, cycle), items in grouped.items():
        first = items[0]
        points = []
        for row in items:
            depth = _number(row.get("pres", ""))
            observed = _number(row.get("temp", ""))
            if depth is None:
                continue
            points.append(ProfilePoint(depth=depth, observed=observed, qc="unknown"))
        points.sort(key=lambda point: point.depth)
        if points:
            profiles.append(
                ArgoProfile(
                    platform=platform,
                    cycle=cycle,
                    timestamp=first["time"],
                    latitude=float(first["latitude"]),
                    longitude=float(first["longitude"]),
                    points=points,
                )
            )
    return profiles


def fetch_argo_profile(platform: str, cycle: int, timeout: float = 15.0) -> ArgoProfile:
    columns = "time,latitude,longitude,platform_number,cycle_number,pres,temp,psal"
    url = (
        "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.csv"
        f"?{columns}&platform_number=%22{quote(platform)}%22&cycle_number={cycle}"
    )
    response = httpx.get(url, timeout=timeout)
    response.raise_for_status()
    profiles = parse_argo_csv(response.text)
    for profile in profiles:
        if profile.platform == platform and profile.cycle == cycle:
            return profile
    raise ValueError(f"Argo profile {platform}/{cycle} not found")


def fixture_profiles() -> list[ArgoProfile]:
    csv_path = Path(__file__).resolve().parents[1] / ".." / "data" / "demo" / "argo_profile.csv"
    if csv_path.exists():
        return parse_argo_csv(csv_path.read_text())
    points = [
        ProfilePoint(depth=float(d), observed=float(t), qc="good")
        for d, t in [
            (1, 29.52), (5, 29.51), (10, 29.47), (20, 29.42), (26, 28.97),
            (50, 27.9), (75, 26.1), (100, 24.7), (150, 21.1), (200, 18.7),
        ]
    ]
    return [ArgoProfile("1902025", 336, "2026-01-01T07:58:42Z", -3.42543, 49.90202, points)]
