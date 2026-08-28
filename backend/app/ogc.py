from __future__ import annotations

import io
import math
import re
import zlib
from dataclasses import dataclass
from xml.sax.saxutils import escape

import numpy as np
from fastapi import HTTPException
from fastapi.responses import Response, StreamingResponse
import xarray as xr

from .scientific import MISSING, ScalarField, subset_field

OGC_NS = "http://www.opengis.net/ows/2.0"
WCS_NS = "http://www.opengis.net/wcs/2.0"
GML_NS = "http://www.opengis.net/gml/3.2"
XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"


def _esc(value: object) -> str:
    return escape(str(value))


def wcs_capabilities(base_url: str, fields: dict[str, ScalarField]) -> Response:
    contents = []
    for fid, f in fields.items():
        contents.append(
            f'''<wcs:CoverageSummary>
<wcs:CoverageId>{_esc(fid)}</wcs:CoverageId>
<wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype>
<wcs:CoverageSubtypeParent>GridCoverage</wcs:CoverageSubtypeParent>
</wcs:CoverageSummary>'''
        )
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="{WCS_NS}" xmlns:ows="{OGC_NS}" xmlns:xsi="{XSI_NS}" version="2.0.1" xsi:schemaLocation="{WCS_NS} http://schemas.opengis.net/wcs/2.0/wcsAll.xsd">
<ows:ServiceIdentification><ows:Title>SIH26067 Ocean Coverage Service</ows:Title><ows:Abstract>CF-compliant ocean data cubes exposed as OGC WCS coverages.</ows:Abstract><ows:ServiceType>WCS</ows:ServiceType><ows:ServiceTypeVersion>2.0.1</ows:ServiceType></ows:ServiceIdentification>
<ows:OperationsMetadata>
<ows:Operation name="GetCapabilities"><ows:DCP><ows:HTTP><ows:Get xlink:href="{_esc(base_url)}/ogc/wcs" xmlns:xlink="http://www.w3.org/1999/xlink"/></ows:HTTP></ows:DCP></ows:Operation>
<ows:Operation name="DescribeCoverage"><ows:DCP><ows:HTTP><ows:Get xlink:href="{_esc(base_url)}/ogc/wcs" xmlns:xlink="http://www.w3.org/1999/xlink"/></ows:HTTP></ows:DCP></ows:Operation>
<ows:Operation name="GetCoverage"><ows:DCP><ows:HTTP><ows:Get xlink:href="{_esc(base_url)}/ogc/wcs" xmlns:xlink="http://www.w3.org/1999/xlink"/></ows:HTTP></ows:DCP></ows:Operation>
</ows:OperationsMetadata>
<wcs:Contents>{''.join(contents)}</wcs:Contents>
</wcs:Capabilities>'''
    return Response(xml, media_type="application/xml")


def describe_coverage(base_url: str, fid: str, f: ScalarField) -> Response:
    # WCS/CIS describes the coverage domain and range; the native ocean grid is 3-D
    # here, with time exposed as metadata because the currently loaded field is one timestep.
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<wcs:CoverageDescription xmlns:wcs="{WCS_NS}" xmlns:gml="{GML_NS}" xmlns:ows="{OGC_NS}" xmlns:xsi="{XSI_NS}" gml:id="{_esc(fid)}">
<wcs:CoverageId>{_esc(fid)}</wcs:CoverageId>
<wcs:CoverageFunction><gml:GridFunction><gml:sequenceRule axisLabels="depth latitude longitude">+2</gml:sequenceRule><gml:startPoint>0 0 0</gml:startPoint></gml:GridFunction></wcs:CoverageFunction>
<wcs:DomainSet><gml:RectifiedGrid gml:id="grid-{_esc(fid)}" dimension="3">
<gml:limits><gml:GridEnvelope><gml:low>0 0 0</gml:low><gml:high>{len(f.depths)-1} {len(f.latitudes)-1} {len(f.longitudes)-1}</gml:high></gml:GridEnvelope></gml:limits>
<gml:axisLabels>depth latitude longitude</gml:axisLabels>
<gml:origin><gml:Point srsName="EPSG:4326"><gml:pos>{float(f.latitudes[0])} {float(f.longitudes[0])} {float(f.depths[0])}</gml:pos></gml:Point></gml:origin>
<gml:offsetVector>1 0 0</gml:offsetVector><gml:offsetVector>0 1 0</gml:offsetVector><gml:offsetVector>0 0 1</gml:offsetVector>
</gml:RectifiedGrid></wcs:DomainSet>
<wcs:RangeType><swe:DataRecord xmlns:swe="http://www.opengis.net/swe/2.0"><swe:field name="{_esc(f.variable)}"><swe:Quantity><swe:uom code="{_esc(f.units)}"/></swe:Quantity></swe:field></swe:DataRecord></wcs:RangeType>
<wcs:ServiceParameters><wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype><wcs:nativeFormat>application/x-netcdf</wcs:nativeFormat></wcs:ServiceParameters>
<ows:Metadata xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="{_esc(base_url)}/api/fields/{_esc(fid)}/metadata"/>
</wcs:CoverageDescription>'''
    return Response(xml, media_type="application/xml")


def _subset_param(params: list[str], axis: str, coords: np.ndarray) -> tuple[float | None, float | None]:
    # WCS KVP supports subset=axis(value) and subset=axis(low,high). We accept both.
    for raw in params:
        m = re.match(rf"^\s*{re.escape(axis)}\s*\(([^)]*)\)\s*$", raw, re.I)
        if not m:
            continue
        bits = [x.strip() for x in m.group(1).split(',')]
        try:
            if len(bits) == 1:
                value = float(bits[0]); return value, value
            return float(bits[0]), float(bits[1])
        except ValueError:
            raise HTTPException(400, f"Invalid WCS subset for {axis}")
    return None, None


def coverage_netcdf(fid: str, f: ScalarField, subsets: list[str], response_format: str) -> StreamingResponse:
    if response_format.lower() not in {"application/x-netcdf", "application/netcdf", "netcdf", "application/x-netcdf4"}:
        raise HTTPException(400, "This prototype WCS supports application/x-netcdf")
    dz0, dz1 = _subset_param(subsets, "depth", f.depths)
    lat0, lat1 = _subset_param(subsets, "latitude", f.latitudes)
    lon0, lon1 = _subset_param(subsets, "longitude", f.longitudes)
    selected = subset_field(f, lat0, lat1, lon0, lon1, dz0, dz1)
    data = np.where(selected.values == MISSING, np.nan, selected.values).astype('float32')
    ds = xr.Dataset(
        {selected.variable: (("depth", "latitude", "longitude"), data, {
            "units": selected.units,
            "coordinates": "depth latitude longitude",
            "_FillValue": np.float32(MISSING),
        })},
        coords={
            "depth": ("depth", selected.depths, {"standard_name": "depth", "positive": "down", "units": "m"}),
            "latitude": ("latitude", selected.latitudes, {"standard_name": "latitude", "units": "degrees_north"}),
            "longitude": ("longitude", selected.longitudes, {"standard_name": "longitude", "units": "degrees_east"}),
        },
        attrs={
            "Conventions": selected.cf_conventions or "CF-1.8",
            "institution": selected.source,
            "title": selected.product,
            "dataset_id": selected.dataset_id,
            "time": selected.valid_time,
        },
    )
    payload = bytes(ds.to_netcdf())
    return StreamingResponse(io.BytesIO(payload), media_type="application/x-netcdf", headers={"Content-Disposition": f'attachment; filename="{fid}-coverage.nc"'})


def _png(width: int, height: int, rgb: np.ndarray) -> bytes:
    rgb = np.asarray(rgb, dtype=np.uint8).reshape(height, width, 3)
    raw = b''.join(b'\x00' + rgb[y].tobytes() for y in range(height))
    def chunk(kind: bytes, data: bytes) -> bytes:
        return len(data).to_bytes(4,'big') + kind + data + (zlib.crc32(kind + data) & 0xffffffff).to_bytes(4,'big')
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', width.to_bytes(4,'big') + height.to_bytes(4,'big') + b'\x08\x02\x00\x00\x00') + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b'')


def wms_map(f: ScalarField, bbox: tuple[float,float,float,float], width: int, height: int, depth: float = 0) -> Response:
    minx, miny, maxx, maxy = bbox
    width = max(1, min(2048, width)); height = max(1, min(2048, height))
    # WMS 1.3.0 EPSG:4326 BBOX is lat,lon by the formal axis order. We accept the
    # conventional x/y ordering too for browser interoperability via the parameter flag.
    xi = np.linspace(minx, maxx, width)
    yi = np.linspace(miny, maxy, height)
    zi = min(range(len(f.depths)), key=lambda i: abs(float(f.depths[i])-depth))
    src = f.values[zi]
    out = np.full((height,width), np.nan, dtype=float)
    valid_y = (yi >= f.latitudes.min()) & (yi <= f.latitudes.max())
    valid_x = (xi >= f.longitudes.min()) & (xi <= f.longitudes.max())
    if valid_y.any() and valid_x.any():
        yy = np.searchsorted(f.latitudes, yi[valid_y]).clip(1, len(f.latitudes)-1)
        xx = np.searchsorted(f.longitudes, xi[valid_x]).clip(1, len(f.longitudes)-1)
        y0 = yy-1; x0=xx-1
        wy=(yi[valid_y]-f.latitudes[y0])/(f.latitudes[yy]-f.latitudes[y0] + 1e-12)
        wx=(xi[valid_x]-f.longitudes[x0])/(f.longitudes[xx]-f.longitudes[x0] + 1e-12)
        a=src[np.ix_(y0,x0)].astype(float); b=src[np.ix_(yy,x0)].astype(float); c=src[np.ix_(y0,xx)].astype(float); d=src[np.ix_(yy,xx)].astype(float)
        grid=(1-wy[:,None])*(1-wx[None,:])*a + wy[:,None]*(1-wx[None,:])*b + (1-wy[:,None])*wx[None,:]*c + wy[:,None]*wx[None,:]*d
        out[np.ix_(valid_y,valid_x)] = grid
    valid = np.isfinite(out) & (out != MISSING)
    lo,hi = f.values[np.isfinite(f.values) & (f.values != MISSING)].min(), f.values[np.isfinite(f.values) & (f.values != MISSING)].max()
    t=np.clip((np.nan_to_num(out,nan=lo)-lo)/(hi-lo+1e-12),0,1)
    rgb=np.empty((height,width,3),dtype=np.uint8)
    rgb[:,:,0]=(255*t).astype(np.uint8); rgb[:,:,1]=(255*(1-np.abs(2*t-1))).clip(0,255).astype(np.uint8); rgb[:,:,2]=(255*(1-t)).astype(np.uint8)
    rgb[~valid]=0
    return Response(_png(width,height,rgb),media_type='image/png',headers={'Cache-Control':'public, max-age=60'})


def wms_capabilities(base_url: str, fields: dict[str, ScalarField]) -> Response:
    layers=[]
    for fid,f in fields.items():
        layers.append(f'<Layer queryable="1"><Name>{_esc(fid)}</Name><Title>{_esc(f.product)}</Title><CRS>EPSG:4326</CRS><EX_GeographicBoundingBox><westBoundLongitude>{float(f.longitudes.min())}</westBoundLongitude><eastBoundLongitude>{float(f.longitudes.max())}</eastBoundLongitude><southBoundLatitude>{float(f.latitudes.min())}</southBoundLatitude><northBoundLatitude>{float(f.latitudes.max())}</northBoundLatitude></EX_GeographicBoundingBox><BoundingBox CRS="EPSG:4326" minx="{float(f.latitudes.min())}" miny="{float(f.longitudes.min())}" maxx="{float(f.latitudes.max())}" maxy="{float(f.longitudes.max())}"/></Layer>')
    xml=f'''<?xml version="1.0" encoding="UTF-8"?><WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink"><Service><Name>WMS</Name><Title>SIH26067 Ocean Maps</Title><Abstract>Scientific map portrayal of CF ocean coverages.</Abstract><OnlineResource xlink:href="{_esc(base_url)}/ogc/wms"/></Service><Capability><Request><GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="{_esc(base_url)}/ogc/wms"/></Get></HTTP></DCPType></GetCapabilities><GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="{_esc(base_url)}/ogc/wms"/></Get></HTTP></DCPType></GetMap></Request><Layer><Title>INCOIS Ocean Data</Title><CRS>EPSG:4326</CRS>{''.join(layers)}</Layer></Capability></WMS_Capabilities>'''
    return Response(xml,media_type='text/xml')
