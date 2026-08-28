# SIH26067 Ocean Situational Analysis — Design Specification

## Objective
Build a browser-native 3D ocean analysis platform for SIH26067 that combines real numerical ocean-model fields with real in-situ observations. The first vertical slice targets temperature over an Indian Ocean demo region, with interactive depth slicing, a GPU volume view, Argo markers, profile inspection, and model-vs-observation comparison. The system is designed so salinity, currents, additional sensors, NetCDF/text ingestion, and OGC interoperability can be added without replacing the core data contract.

The primary user is an operational oceanographer/forecaster. The primary demo task is: select a field, inspect its 3D structure, click an observation, and immediately compare the observed profile with the model at the same time/location/depth.

## Source Requirements
The supplied SIH26067 statement requires:
- browser-native 3D volumetric rendering of temperature, salinity and currents;
- depth slices, isosurfaces and time animation;
- Argo, glider, CTD and BGC overlays with profile inspection;
- NetCDF and delimited-text ingestion;
- configurable palette, range, log/linear scale, opacity and vertical exaggeration;
- lightweight REST/OPeNDAP backend;
- extensibility for new sensors/variables;
- OGC WMS/WCS and CF-Conventions interoperability;
- INCOIS-deployable architecture;
- science communication/public outreach value.

## Architecture

```text
Copernicus / NetCDF / Zarr      Argo ERDDAP / future sensors
              |                              |
              v                              v
       source adapters                observation adapters
              |                              |
              +-------------+----------------+
                            v
                  canonical scientific model
                            |
                 +----------+----------+
                 |                     |
             query store          render products
                 |                     |
                 +----------+----------+
                            v
                         FastAPI
                            |
                     typed JSON/binary
                            |
                    React + Three.js
                            |
                         WebGL2
```

### Backend
- Python 3.12+
- FastAPI + Pydantic
- xarray for CF-aware multidimensional data and interpolation
- NumPy/SciPy for numeric operations
- copernicusmarine for official Copernicus acquisition/subsetting
- httpx for Argo ERDDAP queries
- Zarr for internal chunked array storage where practical
- NetCDF remains a first-class ingestion/export format

### Frontend
- React + TypeScript + Vite
- Three.js/WebGL2 for the focal 3D scene
- Web Workers for expensive preparation where needed
- DOM/CSS overlays for controls, legends, metadata and charts
- Recharts or lightweight SVG for profile plots; the 3D scene remains GPU-owned

### Rendering contract
The renderer consumes a normalized `ScalarVolume` containing dimensions, coordinates, scalar values, missing-data mask, physical range and provenance. It never parses NetCDF directly.

The first renderer has two modes:
1. depth-slice: a 2D scalar field mapped to a horizontal ocean plane;
2. volume: WebGL2 3D texture ray marching with early termination and bounded sampling.

A renderer quality ladder supports 64^3, 128^3 and 256^3 render volumes. The server retains higher-resolution source data. During interaction the client may use a lower LOD and refine after idle.

### Data domain
The initial demo domain is Bay of Bengal + Arabian Sea with a configurable bounding box. The first field is temperature. Salinity and currents use the same field contract after the temperature path is stable.

## API Contract

`GET /api/health`
- returns service/version status.

`GET /api/datasets`
- returns available datasets and variables.

`GET /api/fields/{field_id}/metadata`
- returns dimensions, coordinate names, units, range, time/depth coverage, source and provenance.

`GET /api/fields/{field_id}/slice?time=&depth=&bbox=&lod=`
- returns a normalized 2D grid plus coordinate metadata.

`GET /api/fields/{field_id}/volume?time=&bbox=&lod=`
- returns a normalized bounded scalar volume suitable for GPU upload.

`GET /api/fields/{field_id}/point?time=&lat=&lon=&depth=`
- returns a sampled model value and interpolation metadata.

`GET /api/observations?bbox=&time=&sensor=&variable=`
- returns observation markers with platform/cycle/timestamp and QC summary.

`GET /api/observations/{platform}/{cycle}/profile`
- returns the selected observation profile.

`GET /api/comparisons/profile?platform=&cycle=&field_id=`
- returns observed/model/delta values with timestamps, QC and interpolation metadata.

All API errors use `{ "error": { "code": string, "message": string, "details": object|null } }`.

## Canonical Scientific Data Model

Every scalar field exposes:
- `variable`: canonical name (`temperature`, `salinity`, `uo`, `vo`)
- `units`
- `time[]`
- `depth[]` in positive-down metres
- `latitude[]`, `longitude[]`
- `values`
- `missing_value`
- `source`
- `product`
- `dataset_id`
- `retrieved_at`
- `valid_time`
- `cf_conventions`

Observation profiles expose:
- platform id
- cycle
- sensor type
- timestamp
- latitude/longitude
- depth
- observed variables
- QC flags

Model comparison explicitly records interpolation method and source timestamps. No silent nearest-cell claim is allowed.

## Interaction Design
The scene is the application. The primary interaction loop is:

`select variable -> choose time -> inspect depth/volume -> click observation -> camera focus -> profile -> model/observation delta`.

Inspired by the interaction grammar of God's Eye View, selected instruments get camera focus, a clear active state, metadata/provenance and an inspector panel. The visual style is original and science-instrument oriented rather than copying that project.

Controls:
- variable selector
- time scrubber/playback
- depth slider
- visualization mode
- opacity
- vertical exaggeration
- transfer-function palette
- min/max range
- log/linear toggle
- reset/focus

## Reliability
The demo ships with a pinned, reproducible fixture dataset generated from a real-data schema and real Argo-derived fixture. A live Argo path is also supported. Live source failures must degrade to clearly labelled cached/replay mode rather than blanking the scene.

Copernicus credentials are never committed. The application can operate from a local prepared subset for the judging environment and has an acquisition command for authenticated source refresh.

## Performance Budgets
- Initial application JS: target < 300 KB gzipped before lazy-loading the 3D renderer.
- API metadata/small JSON: p95 < 200 ms from local deployment.
- First meaningful scene: < 3 s with local fixture data.
- Interaction target: >= 30 FPS on a representative laptop for 128^3 volume; >= 45 FPS for depth-slice mode.
- Volume uploads are bounded by LOD; no unbounded full-resolution transfer to the browser.
- No more than one focal WebGL renderer owns the main scene.

## Testing Strategy
- Python unit tests for coordinate normalization, LOD, missing-value handling, API schemas, Argo parsing and model/observation interpolation.
- TypeScript unit tests for transfer functions, field normalization, renderer state and UI reducers.
- WebGL smoke test: canvas exists, nonblank pixel sample, deterministic camera and render-ready signal.
- E2E: app load -> field render -> depth change -> observation selection -> profile/comparison.
- Visual regression for overview, depth-slice, volume, selected-float inspector, mobile and fallback states.
- Fixture-backed tests must be deterministic; live network tests are isolated and explicitly labelled integration tests.

## Boundaries
### Always
- Preserve source/provenance and units.
- Validate external data at adapters.
- Test data transformations before renderer changes.
- Keep the browser independent of NetCDF parsing.
- Run backend and frontend tests before claiming completion.

### Ask first
- New production dependencies that materially alter architecture.
- Database introduction beyond the current file/index strategy.
- Global high-resolution data ingestion.
- Authentication/user accounts.
- Any feature outside the SIH26067 requirements that changes the core workflow.

### Never
- Commit credentials or private source URLs.
- Claim live data when serving a cached fixture.
- Treat a visual-only mock as a real scientific field without a visible demo/cached label.
- Send full raw NetCDF files to the browser.
- Remove failing tests to make a build green.

## Success Criteria
1. The application starts on host port 9000 and is reachable from the host through the requested forwarding.
2. A real-schema temperature field renders as an interactive depth slice.
3. A bounded scalar volume renders in WebGL2 when supported and degrades to depth-slice mode when not.
4. Real Argo-derived observation markers can be displayed and selected.
5. A selected profile shows observed values and model values with explicit delta/interpolation metadata.
6. Time/depth/opacity/vertical-exaggeration/transfer-function controls affect the scene.
7. Source/provenance/QC are visible.
8. Backend and frontend tests pass, and a rendered smoke test proves the main flow.

## Open Decisions
- Whether production volume rendering remains custom Three.js or adopts vtk.js after the renderer spike. The initial implementation uses Three.js to maximize control and align with the problem statement.
- Exact Copernicus dataset version at judging time; the demo data contract must remain pinned independently of live refresh.
