# SIH26067 Triage Research — 2026-08-28

## Scope
Adversarial feasibility and architecture research for SIH26067 only. No implementation performed.

## Problem statement requirements verified from public SIH-2026 research explorer
- Browser-native 3D visualization of ocean model fields: temperature, salinity, currents.
- Depth slices, isosurfaces, time-step animation.
- Argo, glider, CTD, BGC overlays with geospatially accurate markers.
- Click instrument -> depth-vs-variable profile with timestamps.
- NetCDF + delimited text ingestion, modular for new variables/sources.
- Colorbar editor: palette, min/max, log/linear.
- Variable selector, opacity, vertical exaggeration.
- Lightweight REST/OPeNDAP backend.
- Open standards: OGC WMS/WCS and CF Conventions for NetCDF.
- Extensible plugin-style sensor/model variable support.
- INCOIS deployment target; public outreach/science communication use case.

## Live data verification
### Argo ERDDAP
Endpoint tested live:
https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.csv
Observed working columns: time, latitude, longitude, platform_number, cycle_number, pres, temp, psal.
A real query returned 2026 observations and depth-resolved temperature values.
ERDDAP metadata reports cdm_data_type=TrajectoryProfile, featureType=TrajectoryProfile, Conventions=Argo-3.1/CF-1.6/COARDS/ACDD-1.3.
Metadata time coverage extends through 2026-12-27 in the live response.

### Copernicus Marine
Live product page returned HTTP 200 for GLOBAL_ANALYSISFORECAST_PHY_001_024.
Official 2026 docs verify copernicusmarine Toolbox supports metadata discovery and remote spatial/temporal/depth subsetting to NetCDF, Zarr, CSV/Parquet where applicable. Gridded products can be downloaded as NetCDF or Zarr. No quota is advertised by the official docs.
Target product is the Global Ocean Physics Analysis and Forecast family; variables of interest include thetao (temperature), so (salinity), uo/vo (currents).

## Prior art / competition
- Copernicus MyOcean Pro/Light already provide web 2D/4D exploration, point queries, time/depth navigation and export.
- webODV provides browser-based Argo/profile analysis.
- OceanStreamIO/globe-3d-viewer is an open-source 3D Copernicus globe with daily data, multi-layer display, timeline, point queries and downloads.
- VTK.js is a mature scientific-web visualization toolkit with GPU-accelerated volume rendering, cropping, color transfer functions and LOD; supports WebGL and WebGPU.
- Research literature demonstrates WebGPU volume ray casting for large-scale ocean scalar fields, with early termination/adaptive sampling.

## Key adversarial conclusions
1. A generic 3D ocean globe is NOT enough; Copernicus already has strong viewers and open-source competitors exist.
2. The differentiator should be model-observation co-location and comparison, not visualization alone.
3. Full-resolution browser volume rendering is the primary technical risk; preprocessing/tiling/LOD is mandatory.
4. Do not proxy raw NetCDF/OPeNDAP directly into the browser. Convert/serve render-ready chunks.
5. Start with one regional domain (Bay of Bengal / Arabian Sea) and one scalar variable (temperature) for the vertical-slice MVP.
6. Support salinity and currents through the same normalized field interface after the temperature path is proven.
7. Isosurfaces are a stretch feature after volume/depth-slice rendering is stable.
8. Model-vs-Argo comparison should sample the model at the observation's time/location/depth and display observed/model/Delta, with explicit QC and interpolation metadata.
9. Use CF metadata as the canonical internal variable/coordinate contract.
10. Treat OGC WMS/WCS as interoperability/export interfaces rather than the hot path for interactive volume rendering.

## Preliminary recommended architecture
Source adapters -> normalized scientific data model -> chunked render/query store -> query API -> browser renderer.

Backend:
- Python/FastAPI.
- xarray for CF-aware datasets and interpolation.
- Copernicus Marine Toolbox for source acquisition/subsetting.
- ERDDAP for Argo query acquisition.
- Zarr as internal chunked array representation where practical; NetCDF remains supported for ingestion/export.
- scipy/xarray interpolation for model sampling at observation coordinates.
- SQLite/Postgres/PostGIS only for observation/catalog metadata if needed; do not put 4D arrays in relational DB.

API:
- /datasets
- /fields/{field_id}/metadata
- /fields/{field_id}/slice?time=&depth=&bbox=&lod=
- /fields/{field_id}/volume?time=&bbox=&lod=
- /fields/{field_id}/point?time=&lat=&lon=&depth=
- /observations?bbox=&time=&sensor=&variable=
- /observations/{platform}/{cycle}/profile
- /compare/profile?platform=&cycle=&model_field=
- OGC WMS/WCS adapters for standards/interoperability, not rendering hot path.

Frontend:
- React/TypeScript application.
- Three.js/WebGL2 as the primary renderer to match PS wording and enable custom Data3DTexture/ray-march path.
- Consider vtk.js as a spike/reference for scientific volume rendering, but avoid making two render engines part of the core architecture unless necessary.
- Deck/globe-style geospatial layer for instruments can be implemented in Three.js directly; no need for Cesium unless globe/terrain features become important.
- GPU rendering receives compact normalized scalar volume chunks and metadata, never raw NetCDF.

Rendering tiers:
A. Guaranteed baseline: 2D depth slice texture on 3D ocean coordinate plane.
B. Primary differentiator: WebGL2 3D texture volume ray-march with empty-space skipping/early termination and dynamic transfer function.
C. Isosurface: server-side or worker-side marching cubes on a bounded ROI, not global full-resolution.
D. Currents: sparse arrows/streamlines at reduced resolution; never draw every vector cell.

Data resolution strategy:
- Demo region: Bay of Bengal + Arabian Sea, bounded bbox.
- Interactive render volume: decimated grid sized for browser GPU memory, e.g. roughly 128^3 to 256^3 voxels depending on tested hardware.
- Full-resolution data remains server-side.
- LOD tiers and temporal chunking prevent giant transfers.
- Cache common demo requests.

Model-observation comparison:
1. User clicks Argo float.
2. Backend resolves nearest profile/cycle and QC-valid observations.
3. For each observation depth, sample model field at observation time/lat/lon/depth using CF-aware interpolation.
4. Return observed, model, delta, QC flags, source timestamps, interpolation method.
5. Frontend plots both profiles and highlights mismatch zones.

Operational/demo strategy:
- Build against a pinned, reproducible Copernicus subset for demo reliability.
- Also retain live Argo query path to prove continuously updated data.
- Display source, timestamp, product, resolution, interpolation and QC metadata in UI.
- If network/source unavailable, cached demo data keeps the visual demo alive; UI must label cached/replay mode honestly.

## Hard risks
R1 Browser GPU volume performance — highest risk.
R2 Data coordinate conventions/depth orientation and missing values.
R3 Model/Argo temporal-spatial co-location semantics.
R4 Copernicus credentials/source availability during judging.
R5 Isosurface compute cost.
R6 Scope creep into full global globe/terrain/AI.

## Risk-first validation order
1. Render real 3D scalar volume interactively in browser at target FPS.
2. Stream/subset a real Copernicus volume from backend.
3. Display real Argo profiles and markers.
4. Co-locate model vs Argo and show Delta profile.
5. Add time/depth/opacity/transfer-function controls.
6. Add currents.
7. Add isosurface.
8. Polish science UX and demo narrative.

## Success target for engineering
A judge can: select temperature -> see a real 3D water-column field -> move a depth slice -> scrub time -> click a real Argo float -> inspect its profile -> see model-vs-observation comparison at the same location/time/depth -> inspect provenance/QC -> optionally switch to salinity/currents.
