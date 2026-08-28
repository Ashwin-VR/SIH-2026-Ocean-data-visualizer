
from __future__ import annotations
import csv, io
from dataclasses import dataclass
from math import isfinite
from urllib.parse import quote
import httpx
from .models import ObservationMarker, ProfilePoint, ProfileResponse

@dataclass(frozen=True)
class ArgoProfile:
    platform: str; cycle: int; timestamp: str; latitude: float; longitude: float
    points: list[ProfilePoint]; sensor: str = "Argo"
    variable: str = "temperature"; units: str = "degC"
    def marker(self):
        return ObservationMarker(platform=self.platform,cycle=self.cycle,sensor=self.sensor,latitude=self.latitude,longitude=self.longitude,timestamp=self.timestamp,variables=["temperature","salinity"])
    def response(self):
        return ProfileResponse(platform=self.platform,cycle=self.cycle,sensor=self.sensor,timestamp=self.timestamp,latitude=self.latitude,longitude=self.longitude,variable=self.variable,units=self.units,points=self.points)

def _num(v):
    try:
        x=float(v)
        return x if isfinite(x) else None
    except (TypeError,ValueError): return None

def parse_argo_csv(text: str) -> list[ArgoProfile]:
    rows=list(csv.DictReader(io.StringIO(text))); grouped={}
    for row in rows:
        if not row.get('platform_number') or not row.get('cycle_number'): continue
        try: key=(row['platform_number'].strip(),int(float(row['cycle_number'])))
        except ValueError: continue
        grouped.setdefault(key,[]).append(row)
    out=[]
    for (platform,cycle),items in grouped.items():
        first=items[0]; pts=[]
        for row in items:
            d=_num(row.get('pres')); t=_num(row.get('temp')); s=_num(row.get('psal'))
            if d is None: continue
            pts.append(ProfilePoint(depth=d,observed=t,salinity=s,qc='unknown'))
        pts.sort(key=lambda p:p.depth)
        if pts:
            out.append(ArgoProfile(platform,cycle,first.get('time',''),float(first['latitude']),float(first['longitude']),pts))
    return out

def fetch_argo_profile(platform: str, cycle: int, timeout=20):
    cols='time,latitude,longitude,platform_number,cycle_number,pres,temp,psal'
    q=f'{cols}&platform_number=%22{quote(platform)}%22&cycle_number={cycle}'
    r=httpx.get('https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.csv?'+q,timeout=timeout); r.raise_for_status()
    for p in parse_argo_csv(r.text):
        if p.platform==platform and p.cycle==cycle:return p
    raise ValueError(f'Argo profile {platform}/{cycle} not found')

def fetch_surface_markers(timeout=30):
    cols='time,latitude,longitude,platform_number,cycle_number,pres,temp,psal'
    q=f'{cols}&latitude>=-15&latitude<=25&longitude>=40&longitude<=110&time>=2026-07-01T00:00:00Z&pres>=0&pres<=2'
    r=httpx.get('https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.csv?'+q,timeout=timeout); r.raise_for_status()
    profiles=parse_argo_csv(r.text)
    latest={}
    for p in profiles: latest[p.platform]=p
    return sorted(latest.values(),key=lambda p:p.timestamp,reverse=True)[:120]


def fixture_profiles():
    from pathlib import Path
    path=Path(__file__).resolve().parents[2]/"data"/"demo"/"argo_profile.csv"
    if path.exists(): return parse_argo_csv(path.read_text())
    return []
