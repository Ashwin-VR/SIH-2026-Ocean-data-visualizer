# SIH2026 SSOT — SIH26067 Ocean Data Visualization Platform

> **Status:** Canonical project reference generated from the repository documentation and implementation as inspected on 2026-09-03.
>
> **Purpose:** This document is the single source of truth for the problem, product vision, scientific rationale, architecture, technical implementation, workflows, feasibility, risks, mitigation, impact, benefits, current implementation status, remaining gaps, MVP plan, and demonstration story. It is intended to be the technical foundation for the SIH presentation and for the next MVP build.
>
> **Evidence rule:** Claims marked as current/implemented are grounded in the repository implementation or status documentation. Planned capabilities are explicitly identified as planned or incomplete. This SSOT does not claim OGC conformance certification, full PS completion, or production readiness where the source material does not support such a claim.


## 1. Executive Summary

SIH26067 asks for a web-based interactive 3-D visualization platform that integrates numerical ocean-model outputs with in-situ observations. The required capability set includes temperature, salinity and currents; depth slices; isosurfaces; time animation; Argo/Glider/CTD/BGC overlays; NetCDF and text ingestion; customizable color controls; a scalable REST/OPeNDAP architecture; OGC WMS/WCS and CF interoperability; and an extensible design.

The project responds by building an **Ocean Analysis Console** rather than a standalone 3-D globe. The core design principle is that the ocean is represented as a multidimensional scientific data cube:

```text
time × depth × latitude × longitude × variable
```

Every visualization is treated as a projection, subset, rendering, or analytical operation over that cube. A globe is therefore not the product by itself; it is one synchronized view of the same scientific state. Depth slices, 3-D volume rendering, isosurfaces, current-flow visualization, point queries, vertical profiles, and model-versus-observation comparisons use the same underlying data contract.

The current implementation contains a React/TypeScript frontend, a FastAPI backend, CF-aware NetCDF ingestion, an OGC WMS/WCS boundary, INCOIS data adapters, live Argo observation support, geographic globe rendering with `globe.gl` and Three.js, scalar heatmap rendering, experimental depth/volume/isosurface paths, current-field flow visualization, observation/profile inspection, provenance information, diagnostics, and automated tests.

The strategic differentiator is **scientific traceability**: the system is designed to preserve source identity, product semantics, units, coordinate conventions, missing-value handling, interpolation method, time/depth context and observation QC information instead of treating scientific data as anonymous pixels. This enables a workflow from data discovery to visual analysis to model-observation comparison to provenance.


## 2. Problem Statement and PS Baseline

### 2.1 Core problem

Ocean-model and observational datasets are multidimensional, large, heterogeneous and scientifically sensitive. Conventional visualization tools often separate data access, mapping, 3-D visualization and observational analysis. A user may see a map, but still need separate tools to inspect a depth profile, compare a model value against an Argo observation, determine which product is being shown, or understand how interpolation and masking were applied.

SIH26067 requires a browser-based platform that brings these activities together. The target experience is an interactive 3-D scientific workspace capable of handling both numerical model output and in-situ observations.

### 2.2 PS capability baseline

The project documentation records the PS requirements as:

- numerical ocean model output integrated with in-situ observations;
- temperature, salinity and current visualization;
- surface and depth-slice views;
- 3-D volume visualization;
- isosurface visualization;
- time animation;
- Argo, Glider, CTD and BGC observation overlays;
- NetCDF and delimited/text ingestion;
- customizable color ranges/colorbars;
- vertical exaggeration for 3-D depth views;
- REST/OPeNDAP-style scalable access;
- OGC WMS/WCS interfaces;
- CF interoperability;
- an extensible architecture.

### 2.3 Two simultaneous objectives

The project must satisfy two separate but inseparable objectives:

1. **Scientific data correctness:** source data must be normalized and exposed without losing scientific meaning.
2. **Scientific usability:** the browser must let a user inspect and reason about the data interactively.

A visually impressive interface with a wrong axis order, depth direction, variable or unit is not a successful ocean-analysis platform. Conversely, a scientifically correct backend that cannot support responsive exploration does not meet the interactive 3-D intent.


## 3. Gaps in Existing Solutions and the Project's Differentiation

The repository research and design documents frame the key gap as the separation between **data access, visualization, observation analysis and provenance**. The project is not positioned as a claim that no ocean visualization software exists; instead, its differentiator is the integrated browser workflow and the common data-cube abstraction.

### 3.1 Gap: visualization without scientific semantics

A generic 3-D globe can render a colored surface but may not expose:

- exact numeric value;
- units;
- product type;
- valid time;
- native resolution;
- interpolation method;
- QC state;
- source dataset identity.

**Our approach:** the API models metadata and scientific semantics alongside values, and the UI includes a provenance/method panel and render-state diagnostics.

### 3.2 Gap: surface-only visualization

Ocean processes are inherently three-dimensional. A surface heatmap alone cannot expose subsurface structure.

**Our approach:** the same field supports surface, depth-slice, bounded volume and isosurface representations.

### 3.3 Gap: observations and model data treated separately

Observation points are often displayed as markers without a direct analytical join to a model/analysis field.

**Our approach:** an Argo selection leads to profile retrieval and model sampling at the observation's position/depth, producing matched points and deltas.

### 3.4 Gap: massive datasets sent to the browser

A numerical ocean archive can be gigabytes in size. The repository research identifies an approximately 9.9 GB INCOIS RSMC HYCOM source as a target numerical-model dataset. Full-browser download is therefore infeasible.

**Our approach:** server-side subsetting, cached time metadata, bounded render-ready cubes, LOD/stride controls and remote subset access.

### 3.5 Gap: provider lock-in

A client tightly coupled to one provider's API becomes difficult to extend.

**Our approach:** source adapters normalize external datasets into a common scientific field contract; CF and OGC boundaries provide standards-oriented interfaces.

### 3.6 Gap: visual plausibility mistaken for correctness

Wrong longitude orientation, depth ordering, fill-value handling, scaling or interpolation can produce plausible but scientifically incorrect displays.

**Our approach:** explicit normalization, metadata exposure, synthetic scientific fixtures, point-query truth paths, source-to-display traceability and validation gates before new visual effects.

### 3.7 Core differentiator

The defensible innovation is therefore not a single shader or map layer. It is the **synchronized scientific state model**:

```text
One data cube
      ↓
multiple synchronized views
      ↓
interactive analysis
      ↓
observation/model comparison
      ↓
provenance + QC + reproducibility
```


## 4. Proposed Solution — Ocean Analysis Console

The proposed solution is a browser-native scientific workstation for ocean data. The interface combines a geographic globe, analytical controls, observation discovery, profile inspection, comparison and provenance in one workflow.

### 4.1 User-facing capabilities

The console allows a user to:

1. select a scientific variable;
2. select a valid time;
3. inspect the geographic surface field;
4. move through depth;
5. switch to a bounded 3-D volume;
6. extract an isosurface;
7. switch to vector current visualization;
8. select an Argo observation;
9. inspect its vertical profile;
10. compare observation and model/analysis values;
11. inspect source and method metadata.

### 4.2 Product philosophy

The interface is intentionally organized around the question:

> **What does the ocean field look like, where is it, how does it change with depth/time, and how does it compare with what instruments observed?**

This makes the platform useful both as a scientific exploration tool and as an outreach/demo interface, while keeping the scientific source and limitations visible.

### 4.3 Current product identity

The current UI identifies itself as **OCEAN ANALYSIS CONSOLE — SIH26067 · INDIAN OCEAN SCIENTIFIC WORKSPACE** and labels live-source state. It uses an observation rail, analysis representation controls, a scientific renderer, a right-side inspector and a provenance panel.


## 5. Canonical Scientific Data Model

The canonical model is a multidimensional coverage:

```text
time × depth × latitude × longitude × variable
```

The current in-memory scalar field implementation is represented as a normalized 3-D field for one valid time:

```text
depth × latitude × longitude
```

with metadata identifying its valid time. The frontend can request different time indices and the remote adapter can retrieve the selected time slice.

### 5.1 Why the cube is the central abstraction

The cube prevents every visualization from developing its own incompatible data logic. Instead:

| View/operation | Cube operation |
|---|---|
| Globe | select a surface/depth projection and map to geographic sphere |
| Depth slice | reduce the cube at a selected depth |
| Volume | extract a bounded 3-D sub-cube |
| Isosurface | compute a level set from a 3-D scalar field |
| Currents | interpret U/V as a vector field |
| Argo | join point/profile observations to the field |
| Point query | interpolate a scalar value at lat/lon/depth/time |
| Profile | collect values along depth at a location/time |
| Transect | sample along a user-defined path |
| Statistics | aggregate a selected region/sub-cube |
| Change/anomaly | compare time states |

### 5.2 Coordinate conventions

The normalization boundary is responsible for coordinate semantics. Depth is normalized to **positive-down metres**. Latitude and longitude are preserved as explicit coordinate arrays. The ingestion path detects common CF-style dimension aliases and transposes values to `depth, latitude, longitude`.

### 5.3 Missing values

The current implementation uses `-9999.0` as the internal missing-value sentinel after ingestion. NetCDF input is opened with CF decoding and mask/scale handling. Missing/non-finite source values are normalized to the sentinel; API responses include the missing value so clients can distinguish it from a real measurement.

### 5.4 Scientific warning

A color is a visualization encoding, not a measurement. The application must therefore expose numeric values and metadata whenever the user needs to make a scientific interpretation.


## 6. End-to-End Technical Architecture

```text
                 DATA SOURCES
                      │
        ┌─────────────┼────────────────┐
        │             │                │
      INCOIS        Argo          Other adapters
   VAM / OSF /     ERDDAP        Copernicus etc.
      HYCOM           │                │
        │             │                │
        └─────────────┼────────────────┘
                      ▼
             INGESTION / ADAPTERS
                      │
              CF-aware normalization
                      │
                      ▼
              SCIENTIFIC FIELD MODEL
        time × depth × lat × lon × variable
                      │
          ┌───────────┼─────────────┐
          │           │             │
       Query API   OGC WMS/WCS   Observation API
          │           │             │
          └───────────┼─────────────┘
                      ▼
               React / TypeScript
                      │
             Three.js / globe.gl
                      │
        ┌─────────────┼─────────────────┐
        │             │                 │
      Surface      Depth/3-D        Observations
      heatmap      volume/iso       + profiles
        │             │                 │
        └─────────────┼─────────────────┘
                      ▼
            Integrated analysis workflow
```

### 6.1 Backend responsibilities

The backend is a FastAPI service. It is responsible for:

- source adapters;
- NetCDF/CF ingestion;
- normalization;
- field catalog;
- metadata;
- spatial/depth/time subsetting;
- point sampling;
- volume/slice serialization;
- current vector responses;
- Argo marker/profile retrieval;
- model-observation comparison;
- WMS/WCS interfaces;
- serving the production frontend bundle.

### 6.2 Frontend responsibilities

The React/TypeScript frontend is responsible for:

- scientific control state;
- variable/time/depth selection;
- visualization representation selection;
- globe interaction;
- scalar heatmap texture generation;
- WebGL2 3-D volume rendering;
- isosurface rendering;
- current streamlines;
- Argo selection;
- profile/comparison presentation;
- provenance and diagnostics.

### 6.3 Why this separation

The browser should not become a scientific data-ingestion engine. Heavy/remote data access, normalization and standards interfaces belong at the server boundary. The browser should receive appropriately bounded, render-ready data while retaining enough metadata for scientific interpretation.


## 7. Technology Stack and Why Each Technology Is Used

### 7.1 Languages

- **Python 3.12+** — backend and scientific data services.
- **TypeScript** — strongly typed browser application and API contracts.
- **JavaScript/HTML/CSS** — browser runtime and presentation through the TypeScript/React build.

### 7.2 Backend technologies

- **FastAPI** — HTTP API framework; provides typed request validation, routing and OpenAPI-friendly service structure.
- **Pydantic 2.x** — explicit API response/request data models and validation.
- **NumPy** — numerical arrays, subsetting, interpolation and vector calculations.
- **xarray** — CF-aware multidimensional NetCDF access and dataset manipulation.
- **SciPy** — listed as an optional science dependency for scientific operations.
- **NetCDF4** — optional science dependency for NetCDF ecosystem support.
- **Zarr** — optional science dependency for chunked/scalable scientific storage paths.
- **copernicusmarine** — optional dependency for Copernicus Marine integration.
- **httpx / requests** — remote HTTP data access.

### 7.3 Frontend technologies

- **React 19** — UI/state composition.
- **Three.js 0.179** — GPU-accelerated 3-D rendering and shader/data-texture primitives.
- **globe.gl 2.45** — geographic globe, camera interaction and geographic point/path layers.
- **Vite 7** — frontend development/build tool.
- **Vitest** — frontend unit tests.
- **Playwright** — intended browser/E2E validation.
- **world-atlas / topojson-client** — geographic support dependencies.

### 7.4 Rendering technologies

The project uses WebGL2-capable Three.js features. The volume path uses `THREE.Data3DTexture`, a 3-D GPU texture containing normalized scalar values. The volume shader performs ray marching through a bounded box. The isosurface path performs marching-tetrahedra-style extraction on the client-side bounded volume.

### 7.5 Hardware assumptions

The architecture assumes a modern browser with WebGL2 for 3-D views. The exact production hardware/performance envelope is **not yet established** and is therefore a validation gap. The system must degrade gracefully to lighter representations when a target device cannot sustain the desired 3-D workload.


## 8. Backend Implementation — Detailed

### 8.1 Application entry point

`backend/app/main.py` constructs the FastAPI application and mounts the production frontend bundle when `frontend/dist` exists. It also mounts Earth assets under `/earth`. The service uses permissive CORS during development.

### 8.2 API surface currently implemented

```text
GET /
GET /api/health
GET /api/fields
GET /api/fields/{field_id}/times
GET /api/fields/{field_id}/metadata
GET /api/fields/{field_id}/slice
GET /api/fields/{field_id}/volume
GET /api/fields/{field_id}/cube
GET /api/fields/currents/vector
GET /api/fields/{field_id}/point
GET /api/observations
GET /api/observations/{platform}/{cycle}/profile
GET /api/comparisons/profile
GET /ogc/wms
GET /ogc/wcs
```

Unknown API paths are prevented from being accidentally satisfied by the SPA fallback.

### 8.3 Error model

API errors use a structured form:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```

FastAPI validation errors are converted to the same structure. This makes failures consumable by the frontend without relying on free-form server messages.

### 8.4 Field catalog

The current catalog can expose:

- temperature — °C — INCOIS ARGO Monthly VAM;
- salinity — PSU — INCOIS ARGO Monthly VAM;
- surface currents — m s⁻¹ — INCOIS Ocean State Forecast.

The catalog also carries a kind and display color range.

### 8.5 Scientific field model

`ScalarField` stores:

```text
variable
units
depths[]
latitudes[]
longitudes[]
values[depth,lat,lon]
valid_time
source
product
dataset_id
cf_conventions
```

This is the internal contract between ingestion, scientific operations and APIs.

### 8.6 CF-aware NetCDF ingestion

`open_cf_scalar_field()` opens a NetCDF dataset with `decode_cf=True` and `mask_and_scale=True`. It resolves common dimension aliases:

```text
depth / pres / lev / z / zax
latitude / lat
longitude / lon
```

It then transposes the data to:

```text
depth × latitude × longitude
```

Depth coordinates are normalized to positive-down metres; descending depth arrays are reversed so the coordinate order is increasing. Non-finite values are converted to the internal missing-value sentinel. Dataset metadata provides source/product/dataset/CF information.

### 8.7 Spatial/depth subsetting

The `subset_field()` operation accepts optional bounds and strides for latitude, longitude and depth. It builds boolean masks, converts them to index arrays, and extracts the corresponding sub-cube. Strides provide a simple first level of LOD/downsampling.

### 8.8 Depth slice

The API receives a requested depth and chooses the nearest available native depth level. The resulting 2-D latitude × longitude field is returned with coordinates, shape, bounds and missing-value information. The browser then interpolates the native grid into a display raster for the globe.

### 8.9 Volume

The volume API returns a bounded 3-D subset. The response includes shape, flattened values, depth/latitude/longitude coordinates, bounds, source and valid time. LOD can stride dimensions before serialization.

### 8.10 Point sampling

`sample_field()` performs trilinear interpolation in depth, latitude and longitude. It brackets each requested coordinate, calculates normalized weights and combines the eight surrounding cell values. The response explicitly records `interpolation: trilinear`.

This point-query path is intended to become the authoritative scientific truth path:

```text
raw source
   ↓
normalized field
   ↓
API sample
   ↓
UI displayed value
```

### 8.11 Remote INCOIS access

`remote.py` uses the INCOIS ERDDAP `griddap` service for temperature/salinity time values and selected field retrieval. The current remote field query requests a single time index and bounded native index ranges rather than downloading the complete archive. Time values are cached; field retrieval is cached with a bounded cache.

The documented production direction is to use server-side remote subsetting for large numerical model products such as HYCOM.

### 8.12 Currents

The current adapter opens the INCOIS surface-current NetCDF, reads `U` and `V`, converts non-finite values to the missing sentinel, and returns latitude/longitude arrays plus source and valid-time metadata. The API exposes U and V as a vector field rather than treating current as a scalar.

### 8.13 Argo adapter

The Argo adapter retrieves CSV observations from IFREMER Argo ERDDAP, groups rows by platform/cycle, parses pressure, temperature and salinity, sorts points by depth, and creates observation markers. Surface markers are filtered to an Indian Ocean region and recent period, then reduced to the latest profile per platform up to a bounded marker count.

### 8.14 Model-observation comparison

The comparison endpoint loads an Argo profile, selects the requested field, samples the field at the profile's latitude/longitude and each observation depth, and returns:

```text
depth
observed
model
delta = model - observed
QC
```

The current response labels the interpolation as trilinear. Full temporal co-location and a production numerical-model path remain gaps.


## 9. Frontend Implementation — Detailed

### 9.1 Application state model

`App.tsx` holds the synchronized scientific state:

```text
fields
field
times
timeIndex
view
depth
opacity
exaggeration
volume
slice
currents
observations
selected observation
profile
comparison
error
```

When the variable changes, the application refreshes its time list and observation-related state. For scalar fields it requests volume and slice data for the selected time/depth. For currents it requests the vector field. Selecting an observation requests the profile and model comparison in parallel.

### 9.2 Code splitting

`OceanScene` is lazy-loaded. This keeps the initial application bundle smaller and defers the heavier 3-D renderer until required.

### 9.3 API client

`frontend/src/lib/api.ts` defines TypeScript response types corresponding to backend Pydantic models and centralizes fetch/error handling. The API base can be configured through `VITE_API_BASE_URL`; an empty value allows same-origin production serving.

### 9.4 Globe

`globe.gl` provides the geographic sphere, camera controls, point layers and path layers. Earth textures are served from `/earth`. The camera is initialized over the Indian Ocean region.

The geographic conversion function maps latitude/longitude to a 3-D sphere using spherical coordinates. The project explicitly corrected the earlier longitude orientation issue so that India is between the Arabian Sea to the west and Bay of Bengal to the east.

### 9.5 Surface scalar rendering

The selected depth slice is converted to a display raster. The renderer:

1. creates a canvas;
2. maps each display pixel to latitude/longitude;
3. bilinearly interpolates the native slice grid;
4. maps the scalar value to a palette;
5. writes RGBA pixels;
6. creates a Three.js `CanvasTexture`;
7. maps the texture onto a sphere slightly above the Earth.

This is explicitly a **display interpolation** and not the creation of new scientific observations.

### 9.6 Depth slice rendering

The same field texture is applied to a smaller spherical shell. The shell radius decreases with depth, providing a visual representation of subsurface depth while preserving geographic context. The current depth geometry uses a bounded 0–2000 m mapping for the demonstrator. This visualization needs further scientific/browser validation before being marked complete.

### 9.7 Volume rendering

The volume path is based on:

```text
API 3-D values
   ↓
normalize to [0,1]
   ↓
THREE.Data3DTexture
   ↓
3-D box
   ↓
fragment-shader ray marching
```

The shader estimates a camera ray in local volume coordinates, intersects it with the box, marches a bounded number of samples, reads the 3-D texture and accumulates color/opacity front-to-back. Early termination occurs when accumulated opacity becomes high.

The volume is bounded to the selected dataset extent/subset; the full source archive is not sent to the browser.

### 9.8 Isosurface

The current implementation performs marching-tetrahedra-style extraction. A normalized scalar volume is divided into tetrahedral cells; each cell is classified against a threshold; edge intersections are interpolated; resulting triangles are accumulated into a `BufferGeometry`; normals are computed and a transparent double-sided material is applied.

The threshold is currently a demonstrator-level normalized value and must be exposed/validated as a scientific control in the completed MVP. Synthetic geometry tests are required before acceptance with real data.

### 9.9 Current flow rendering

The frontend treats currents as U/V vectors. It bilinearly interpolates the vector field at a geographic position and integrates forward/backward paths from a seed grid. These paths are displayed through `globe.gl` as animated dashed streamlines.

A uniform/circular synthetic vector field should be used to validate direction and integration before real-data acceptance. A density control remains a gap.

### 9.10 Observation interaction

Argo markers are displayed on the globe and in an observation rail. Clicking a marker selects the profile, retrieves profile data and comparison data, and keeps the selected observation synchronized with the rest of the UI.

### 9.11 Profile/comparison visualization

The profile inspector plots observed values against depth and overlays model values. It reports matched depths and maximum absolute delta. This is a visual comparison, not yet a complete scientific validation suite.

### 9.12 Provenance and diagnostics

The UI displays source/product/interpolation semantics. The development debug panel exposes view, field, source, time index, depth, grid shape, range, opacity, vertical exaggeration and current-grid information. This makes browser-side failures inspectable rather than opaque.


## 10. OGC and CF Interoperability

### 10.1 Why standards are part of the architecture

The system must work with heterogeneous scientific data and existing geospatial infrastructure. CF provides conventions for multidimensional scientific data; OGC WMS provides map portrayal; WCS provides coverage/data access.

### 10.2 WMS 1.3.0

The current prototype supports `GetCapabilities` and `GetMap`. The implementation supports `image/png`, geographic bounding boxes and `EPSG:4326` / `CRS:84` axis handling. It explicitly documents the WMS 1.3.0 axis-order distinction.

The map renderer samples the selected depth and creates a PNG from the field. This is a prototype portrayal path and is not an OGC conformance certification.

### 10.3 WCS 2.0.1

The current prototype supports:

- `GetCapabilities`;
- `DescribeCoverage`;
- `GetCoverage`.

Coverage responses are NetCDF. WCS subsets accept depth/latitude/longitude expressions and the server creates a CF-aware NetCDF dataset for the requested subset.

### 10.4 CF

NetCDF ingestion uses xarray CF decoding and preserves/normalizes:

- coordinate names;
- units;
- depth positive direction;
- missing values;
- CF convention metadata;
- product/source metadata.

### 10.5 Conformance boundary

The project shall state **OGC interoperability/prototype support**, not OGC certification, until the appropriate conformance tests are executed and passed.


## 11. Data Sources and Source Semantics

### INCOIS ARGO Monthly VAM

Used for the current temperature/salinity demonstrator. The project documentation identifies these as objectively analysed Argo-derived fields, **not numerical forecasts**. This distinction must be preserved in the PPT and UI.

### INCOIS Ocean State Forecast currents

Used for surface U/V current visualization. The implementation correctly models currents as a vector field.

### Argo ERDDAP

Used for live observation markers and profile retrieval. The adapter obtains platform/cycle, location, timestamp, pressure, temperature and salinity information.

### INCOIS numerical HYCOM

This is the target numerical-model path. The repository research identifies a large source archive of approximately 9.9 GB containing temperature, salinity, U and V at multiple depth levels. The intended architecture is server-side subset access. The complete numerical-model hot path is not yet complete.

### Copernicus Marine

Identified by the research as an external source/fallback and supported conceptually by the modular adapter architecture. It is not intended to displace the INCOIS-first core demonstration.


## 12. Core Scientific Workflows

### 12.1 Variable → time → depth → view

```text
Choose variable
      ↓
Load valid times
      ↓
Choose time
      ↓
Choose depth
      ↓
Request bounded field subset
      ↓
Render globe / slice / volume / isosurface
```

### 12.2 Model-observation workflow

```text
Select Argo float
      ↓
Retrieve platform/cycle profile
      ↓
Read observation time + lat/lon + depths
      ↓
Sample model/analysis field at same spatial/depth coordinates
      ↓
Compute model - observed
      ↓
Display profile + matched values + Δ
      ↓
Show source / interpolation / QC
```

### 12.3 Currents workflow

```text
Load U/V field
      ↓
Normalize coordinates and missing values
      ↓
Bilinear vector interpolation
      ↓
Seed geographic points
      ↓
Integrate forward/backward streamlines
      ↓
Animate paths on globe
```

### 12.4 Scientific truth workflow

```text
Source NetCDF/ERDDAP value
          ↓
CF decode + mask/scale
          ↓
canonical coordinates
          ↓
normalized ScalarField
          ↓
API query
          ↓
browser renderer
          ↓
numeric value + visual encoding
```

Every step must remain traceable for validated scientific workflows.


## 13. Methodology and Implementation Process

The project follows a **scientific-first vertical-slice methodology**. The central rule from the implementation status document is: do not add visual effects before the scientific data path is stable.

### Phase 1 — Scientific field audit

For every supported field:

1. read metadata;
2. record dimensions;
3. record coordinate ranges;
4. record coordinate direction;
5. record depth levels;
6. record time intervals;
7. record units;
8. record fill values;
9. calculate statistics;
10. compare raw values with normalized values.

### Phase 2 — Authoritative point query

Build one traceable value path from source to browser. This catches axis, interpolation, unit and missing-value errors early.

### Phase 3 — 2-D slice

Make depth slices correct and browser-validated before introducing more expensive 3-D rendering.

### Phase 4 — 3-D volume

Validate ray marching using a known synthetic volume, then real ocean data.

### Phase 5 — Isosurface

Validate against a synthetic sphere/known scalar field before real-data acceptance.

### Phase 6 — Currents

Validate uniform/circular synthetic flows before INCOIS U/V acceptance.

### Phase 7 — Observation join

Use an Argo profile and co-locate model data at observation time, position and depth.

### Phase 8 — Scientific UI

Expose value, units, source, product type, time, depth, native resolution, interpolation, QC and mask state.

### Phase 9 — Scale

Add server-side remote subset, chunking, caching and multi-resolution/LOD.

### Phase 10 — Standards/deployment

Validate WMS/WCS and prepare deployment on target infrastructure.

### Phase 11 — Demonstration

Use a single coherent ocean-analysis scenario rather than disconnected feature demos.


## 14. Feasibility Analysis

### 14.1 Technical feasibility — high for the demonstrator

The core technology stack is mature and the repository already contains a working vertical slice. React/TypeScript handles the UI, FastAPI handles typed scientific APIs, xarray/NumPy handle multidimensional data, and Three.js/WebGL2 handles browser-side 3-D rendering.

### 14.2 Data feasibility — high for INCOIS/Argo demonstration, conditional for large numerical models

The current project already loads INCOIS VAM fields, INCOIS surface currents and live Argo observations. The remaining issue is not whether the data exists but how large numerical model data is subset and cached. The HYCOM target is too large for full browser transfer, making server-side subsetting essential.

### 14.3 Performance feasibility — feasible with bounded subsets and LOD

The current implementation already uses LOD/stride parameters, bounded volume responses, lazy loading of the heavy renderer and GPU data textures. Formal target-hardware benchmarking is still required.

### 14.4 Scientific feasibility — feasible if validation is treated as a first-class requirement

The major risk is not mathematical impossibility; it is silent scientific misinterpretation. Explicit coordinate conventions, source metadata, interpolation declarations, synthetic tests and raw-to-rendered truth checks make this manageable.

### 14.5 Deployment feasibility

The backend can serve the compiled frontend from `frontend/dist` and expose port 9000. The project is therefore suitable for a single-host demonstrator. Production deployment still requires target infrastructure validation, security hardening, resource sizing and large-data strategy.


## 15. Challenges, Risks and Mitigation Strategies

| Risk | Why it matters | Mitigation | Current status |
|---|---|---|---|
| 9.9 GB-scale numerical model | Browser cannot download whole archive | server-side subset, caching, chunking, LOD | gap |
| Coordinate axis reversal | Scientifically wrong geography | explicit normalization + known geographic checks | partially addressed |
| Depth direction | Inverted ocean structure | positive-down canonical depth | implemented in ingestion |
| Missing/fill values | Invalid pixels/incorrect interpolation | CF mask/scale + sentinel + renderer checks | implemented |
| Unit/product confusion | Misleading scientific claims | metadata/provenance panel and source semantics | implemented foundation |
| 3-D GPU cost | Browser crashes or low FPS | bounded volumes, lazy renderer, LOD, step limits | partially implemented |
| Isosurface correctness | visually plausible but wrong geometry | synthetic sphere/field validation | gap |
| Current flow correctness | wrong direction due to U/V or integration | synthetic vector fields before real data | gap |
| Model-observation mismatch | false error estimates | explicit time/space/depth co-location + interpolation metadata | gap |
| Observation heterogeneity | Argo/Glider/CTD/BGC schemas differ | adapter boundary + common observation contract | Argo foundation only |
| Remote service outage | live data unavailable | cached/fallback data + explicit source state | partially addressed |
| OGC semantics | interoperability failures | standards-aware API + conformance testing | prototype |
| Browser E2E instability | incomplete acceptance evidence | deterministic unit/API tests + target-browser QA | gap |
| Stale server process | browser sees old API | verify active server before QA | encountered and corrected |
| Overclaiming | SIH evaluation risk | clearly separate implemented, planned and validated | SSOT rule |


## 16. Testing and Validation Strategy

### 16.1 Backend tests

The backend test suite covers API behavior, Argo parsing/adapters, ingestion, live adapters, models and scientific functions.

### 16.2 Frontend tests

The frontend includes a volume/scalar normalization test path.

### 16.3 Browser/E2E

Playwright is configured, but repository status notes that Chromium crashes with SIGSEGV in the Kali VM; therefore E2E coverage is incomplete and cannot be presented as fully validated.

### 16.4 Synthetic scientific fixtures

Before accepting real data, use deterministic fixtures:

- constant scalar field — verifies range/color normalization;
- known linear field — verifies interpolation;
- known sphere — verifies isosurface geometry;
- uniform vector field — verifies current direction;
- circular vector field — verifies flow integration;
- known coordinate orientation — verifies longitude/latitude mapping.

### 16.5 Acceptance evidence

The final SIH demonstration should show not only screenshots but measurable evidence:

- API health;
- data source and valid time;
- grid dimensions;
- value ranges;
- selected depth;
- numeric point values;
- model-observation delta;
- provenance;
- response/subset size where relevant;
- browser performance on the chosen hardware.


## 17. Current Implementation Status

### Implemented foundation

- React + TypeScript frontend.
- FastAPI backend.
- CF-aware scalar ingestion.
- INCOIS VAM temperature/salinity fields.
- INCOIS surface U/V current field.
- Live Argo marker/profile adapter.
- Geographic globe.
- Corrected India/Arabian Sea/Bay of Bengal orientation.
- Earth texture assets.
- Continuous scalar surface heatmap.
- Depth-slice path.
- WebGL2 3-D volume path.
- Isosurface extraction path.
- Current streamline path.
- Observation inspector.
- Model/observation comparison foundation.
- Provenance panel.
- Render-state diagnostics.
- WMS/WCS prototype interfaces.
- Backend/frontend automated tests.

### Explicitly incomplete / not yet accepted against the full PS

- numerical HYCOM server-side hot path;
- complete scientific validation;
- browser acceptance of depth view;
- browser/scientific acceptance of volume;
- browser/scientific acceptance of isosurface;
- current-flow validation and density control;
- robust model-observation temporal/spatial co-location;
- Glider, CTD and BGC adapters;
- point/transect/statistics/gradient/change/flow-integration analytics;
- complete time animation validation;
- formal OGC conformance testing;
- target-hardware performance benchmarks;
- formal multi-resolution/LOD strategy for very large datasets;
- final end-to-end user workflow refinement;
- production deployment validation.


## 18. Definition of Done for the Full PS

The full solution is considered complete when:

- real numerical model data can be queried without full archive download;
- temperature and salinity use the common field contract;
- currents use valid U/V data;
- geographic orientation is correct;
- scalar surface fields are continuous and scientifically bounded;
- depth slices work;
- volumes work;
- isosurfaces work;
- current flow works;
- time animation works;
- Argo, Glider, CTD and BGC overlays work;
- profiles can be inspected;
- model and observation values can be compared;
- numeric values and provenance are visible;
- NetCDF and delimited-text ingestion work;
- WMS/WCS work;
- CF metadata is preserved;
- remote subset access works;
- LOD prevents oversized browser transfers;
- browser tests pass;
- scientific validation tests pass;
- deployment works on target infrastructure;
- the public/outreach view explains sources and limitations.


## 19. MVP Build Plan from This SSOT

The next MVP should be built in this order:

### MVP-1 — Lock the scientific contract

Freeze `ScalarField`, metadata, missing-value semantics, coordinate conventions and API response schemas. Add golden-value tests.

### MVP-2 — Make the point truth path authoritative

For temperature and salinity, select known source coordinates and prove:

```text
source value → normalized value → API value → UI value
```

### MVP-3 — Finish depth slice

Validate native-depth selection, latitude/longitude orientation, bounds, missing values and color scaling.

### MVP-4 — Finish volume

Validate Data3DTexture dimensions, coordinate mapping, ray-box intersection, opacity, sampling steps and performance using a synthetic volume and a real subset.

### MVP-5 — Finish isosurface

Expose a scientific threshold control, validate known geometry and then real data.

### MVP-6 — Finish currents

Validate U/V orientation and magnitude, add streamline density controls and quantitative vector information.

### MVP-7 — Complete Argo comparison

Add explicit temporal co-location and interpolation metadata. Show observation, model and delta at matched depths.

### MVP-8 — Add observation adapters

Generalize the observation contract for Glider, CTD and BGC.

### MVP-9 — Add analytics

Point, profile, transect, statistics, gradients, temporal change/anomaly and current-flow integration.

### MVP-10 — Scale the data path

Complete server-side HYCOM/remote subset, chunking, caching and LOD.

### MVP-11 — Validate standards and deployment

Run WMS/WCS tests, document interoperability, benchmark target hardware and harden deployment.

### MVP-12 — Build the SIH demo narrative

Use one realistic story from variable selection through model-observation comparison and provenance.


## 20. SIH Presentation Narrative — What We Should Prove

The PPT and live demo should make the evaluator understand the project in this order:

### Problem
Ocean information is multidimensional, heterogeneous and large. Existing workflows fragment visualization, analysis and observation comparison.

### Insight
The ocean should be treated as a common scientific data cube rather than as disconnected map layers.

### Solution
Build a browser-native Ocean Analysis Console over that cube.

### Difference
Do not stop at a 3-D globe. Connect visualization to depth, volume, isosurfaces, currents, observations, model comparison and provenance.

### Technical proof
Show the architecture and one traceable API request.

### Scientific proof
Show the source, valid time, units, depth and interpolation semantics.

### Scale proof
Show that large datasets are subset server-side rather than downloaded wholesale.

### Impact proof
Show how scientists, students, decision makers and outreach users benefit from a unified interactive view.

### Honesty
Clearly state what is implemented and what remains in the roadmap. Credibility is stronger than overclaiming.


## 21. Impact and Benefits

### Scientific/technical impact

- Creates a common browser interface over heterogeneous ocean products.
- Reduces the need to switch between visualization, data-access and profile-analysis tools.
- Makes scientific metadata visible at the point of interpretation.
- Provides a reusable adapter/query architecture for future datasets.

### Institutional impact

- Makes INCOIS ocean products easier to explore interactively.
- Provides a standards-oriented boundary for integration with geospatial infrastructure.
- Supports future operational/public-facing visualization without coupling the UI directly to raw archives.

### Educational/outreach impact

- 3-D depth views make subsurface ocean structure easier to understand.
- Argo profiles connect abstract model fields to real measurements.
- Provenance panels teach users that ocean products have different semantics and uncertainties.

### Environmental impact

The platform itself does not directly reduce emissions or alter the environment. Its potential environmental benefit is **informational**: better access to ocean-state information can support research, monitoring, education and decision-making related to marine systems. Such downstream benefits should be presented as potential impact rather than guaranteed outcomes.

### Economic/operational benefit

A reusable data/visualization layer can reduce duplicated effort when different users need to inspect the same ocean products. Server-side subset access also avoids unnecessary transfer of very large source archives to clients.


## 22. Why the Architecture Is Defensible

The architectural decisions can be justified directly:

**Why a data cube?** Because ocean fields vary across time, depth, latitude, longitude and variable; one abstraction allows many synchronized views.

**Why FastAPI?** The project needs a typed, lightweight HTTP service that can expose scientific query operations and structured errors.

**Why xarray?** NetCDF/CF ocean data is multidimensional and metadata-rich; xarray provides a natural representation and CF-aware decoding.

**Why NumPy?** The core scientific operations are array operations: subsetting, interpolation, normalization and vector calculations.

**Why React/TypeScript?** The UI contains many synchronized controls and data states; TypeScript makes API contracts explicit.

**Why Three.js/WebGL2?** Volume rendering and 3-D scientific visualization require GPU acceleration; `Data3DTexture` is a direct representation for a scalar volume on the GPU.

**Why globe.gl?** It provides a geographic interaction layer, camera controls and geographic point/path primitives while allowing custom Three.js layers.

**Why server-side subset?** Full scientific archives are too large for browser transfer; subset responses bound memory, latency and GPU workload.

**Why WMS/WCS?** Map portrayal and multidimensional coverage access serve different interoperability needs; using both avoids forcing a scientific client to consume rendered imagery when it needs actual data.

**Why provenance?** Scientific visualization without source/product/interpolation semantics can be misleading.

**Why synthetic validation?** GPU rendering can look correct while being numerically wrong. Known fields isolate rendering bugs from source-data complexity.


## 23. Repository Technical Map

```text
backend/app/main.py          API, static serving, routes
backend/app/models.py        Pydantic contracts
backend/app/scientific.py    ScalarField, subsetting, slice, volume, interpolation
backend/app/ingestion.py     CF/NetCDF normalization
backend/app/real_fields.py   INCOIS local field loading
backend/app/remote.py        INCOIS ERDDAP remote subset/time access
backend/app/argo.py          Argo live/profile adapter
backend/app/ogc.py            WMS/WCS implementation
backend/tests/*              backend scientific/API tests

frontend/src/App.tsx         application state and workflow orchestration
frontend/src/lib/api.ts      typed API client
frontend/src/lib/volume.ts   scalar normalization/palette logic
frontend/src/components/
  OceanScene.tsx              geographic + 3-D rendering
  ControlPanel.tsx            scientific controls
  ProfileInspector.tsx        observation/model profile comparison
  ProvenancePanel.tsx         source/method display
  RightInspector.tsx          selection inspector
  DebugPanel.tsx              render diagnostics
frontend/public/earth/*       Earth imagery/assets
frontend/src/lib/volume.test.ts frontend rendering utility tests
```


## 24. Build and Run Reference

### Backend environment

Python requirement: 3.12+.

Install backend package from the `backend` directory. Scientific extras are required for NetCDF/xarray/Copernicus functionality.

### Frontend

From `frontend`:

```bash
npm install
npm test
npm run build
```

### Production-style local run

Build the frontend first so `frontend/dist` exists, then from `backend` run:

```bash
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9000
```

The FastAPI application serves `frontend/dist/index.html` at `/` and exposes `/api/health`.

### Development frontend

The Vite development script is configured for:

```text
http://0.0.0.0:9000
```

The backend production-serving route is the preferred single-host demonstrator because it serves the compiled frontend and API from the same origin.


## 25. Source-of-Truth Rules

1. **Do not describe a planned feature as implemented.**
2. **Do not describe VAM as a numerical forecast.**
3. **Do not claim OGC certification without conformance evidence.**
4. **Do not claim full PS completion while the documented gaps remain.**
5. **Do not interpret a color as a numeric scientific result without checking value, units and metadata.**
6. **Do not send full multi-gigabyte archives to the browser.**
7. **Do not add new visualization effects ahead of scientific validation of the data path.**
8. **Keep source/product/time/depth/interpolation/QC semantics attached to analytical results.**
9. **Use synthetic fields to validate rendering algorithms before accepting real ocean data.**
10. **For the SIH PPT, distinguish current prototype evidence from roadmap ambition.**


## 26. Documentation Consolidation and Source Register

This SSOT consolidates the following repository Markdown sources in full below. The original files remain the detailed source documents; this SSOT is the synthesized canonical reference for cross-document consistency.

The repository contains 11 project Markdown sources considered for this consolidation:

1. `README.md`
2. `research.md`
3. `tasks/todo.md`
4. `docs/DATA-CUBE-ARCHITECTURE.md`
5. `docs/OGC-CF-INTEROPERABILITY.md`
6. `docs/decisions/ADR-001-ogc-cf-coverage-interfaces.md`
7. `docs/SIH26067-PROJECT-REQUIREMENTS-ASD-STE100.md`
8. `docs/SIH26067-IMPLEMENTATION-STATUS-AND-ROADMAP-ASD-STE100.md`
9. `docs/superpowers/specs/2026-08-28-sih26067-capability-map.md`
10. `docs/superpowers/specs/2026-08-28-sih26067-ocean-analysis-design.md`
11. `docs/superpowers/plans/2026-08-28-sih26067-mvp.md`

The additional Markdown file mentioned in the task was **not present in the repository workspace or accessible at `/mnt/data` during this generation pass**. Therefore its content has **not** been invented or silently substituted. Once that file is supplied to the workspace, its contents must be merged into this SSOT and its provenance added to this register.


# APPENDIX A — ORIGINAL SOURCE DOCUMENTS

The following sections preserve the repository source Markdown content verbatim so that the SSOT remains lossless with respect to the source set used for this build.


---

# SOURCE: `README.md`

# SIH26067 — Ocean Analysis Console

Browser-native 3D ocean situational analysis for SIH 2026 Problem Statement SIH26067.

## Current vertical slice

- React + TypeScript + Three.js/WebGL2 focal scene.
- FastAPI scientific/query backend.
- Canonical positive-down depth field contract.
- Deterministic Indian Ocean temperature field fixture shaped to CF/Copernicus conventions.
- Argo profile fixture plus live IFREMER ERDDAP adapter.
- Model-vs-observation profile comparison with trilinear sampling and delta values.
- Volume and depth-slice modes, opacity and vertical exaggeration controls.
- Provenance/status panel and instrument inspector.
- NetCDF/CF ingestion adapter using xarray.
- Backend serves the built frontend on `0.0.0.0:9000`.

## Run

### Backend

```bash
cd backend
.venv/bin/python -m pytest -q
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9000
```

The frontend is served by FastAPI from `frontend/dist` after `npm run build`.

### Frontend

```bash
cd frontend
npm install
npm test
npm run build
```

During UI development, use `npm run dev` on another port if the backend is already using 9000.

## Science dependencies

```bash
cd backend
.venv/bin/pip install -e '.[science]'
```

This installs xarray/NetCDF/Zarr/Copernicus Marine tooling. Credentials are read from the environment or Copernicus tooling configuration and are never stored in the repository.

## Live Argo probe

```bash
cd backend
.venv/bin/python - <<'PY'
from app.argo import fetch_argo_profile
profile = fetch_argo_profile("1902025", 336)
print(profile.platform, profile.cycle, len(profile.points))
PY
```

## Architecture documents

- `docs/superpowers/specs/2026-08-28-sih26067-capability-map.md`
- `docs/superpowers/specs/2026-08-28-sih26067-ocean-analysis-design.md`
- `docs/superpowers/plans/2026-08-28-sih26067-mvp.md`
- `research.md`

## Data honesty

The UI labels the current temperature field as a deterministic demo fixture. The Argo adapter can query live IFREMER ERDDAP data. Copernicus acquisition is intentionally kept behind the backend/source-adapter boundary so the browser never receives raw NetCDF.

## Current data sources

The running demo is India-native and uses real INCOIS data:

- **Temperature / salinity:** INCOIS ARGO Monthly Variational Analysis Methodology, CF-1.6, 23 depth levels over the Indian Ocean subset. These are objectively analysed Argo-derived fields, not a numerical forecast model.
- **Surface currents:** INCOIS Ocean State Forecast `CURRENTS_IO_20260827.nc`, reduced only spatially from the authoritative NetCDF for browser serving; U/V vectors and timestamp are retained.
- **Observations:** live Argo profiles from IFREMER/Argo ERDDAP.
- **Numerical-model adapter:** INCOIS RSMC HYCOM is verified as the authoritative numerical-model target. The public file is ~9.9 GB and exposes TEMP, SALN, UVEL and VVEL at six depths. The VM cannot cache that whole file within its available disk budget, so the production architecture keeps HYCOM as a server-side subset/adapter rather than silently substituting VAM.

The UI must label provenance and analysis-vs-model status accordingly.



---

# SOURCE: `research.md`

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



---

# SOURCE: `tasks/todo.md`

# SIH26067 MVP Task Tracker

- [x] Task 1: Repository foundation and contracts
- [x] Task 2: Scientific field engine
- [x] Task 3: Argo adapter and deterministic fixture
- [x] Task 4: FastAPI query surface
- [x] Checkpoint: Backend vertical slice
- [x] Task 5: Frontend foundation
- [x] Task 6: Three.js renderer spike / primary renderer
- [x] Task 7: Analysis workspace UI
- [ ] Task 8: End-to-end integration and visual QA — browser runtime in this VM crashes before page attach; build/API smoke verified, browser QA remains pending on a usable browser runtime.
- [x] Task 9: Real Argo live path and NetCDF ingestion
- [ ] Task 10: Container deployment — direct VM process on `0.0.0.0:9000` is active; Docker packaging remains pending.

## Current checkpoint

Backend: 16 tests passing.
Frontend: 2 unit tests passing; production build passing with 62.22 KB gzip initial bundle and 125.88 KB gzip lazy 3D renderer chunk.
Live Argo: verified against IFREMER ERDDAP for platform `1902025`, cycle `336`, returning 1009 depth points.
HTTP smoke: `/`, `/api/health`, `/api/fields/temperature/volume`, `/api/observations` verified on port 9000.

## Browser QA blocker

Playwright Chromium 151 crashes with SIGSEGV in this VM before a page can attach, even with SwiftShader. Firefox also did not complete a Playwright attach during the initial probe. This is an environment/browser-runtime issue, not treated as evidence that the application itself is broken. A later QA pass must run on a stable browser runtime.

## Data-source correction
- [x] Verified INCOIS RSMC HYCOM public NetCDF: `RSMC_hycom_20260828.nc`; 28 times × 6 depths × 1384 × 1665; TEMP/SALN/UVEL/VVEL.
- [x] Integrated INCOIS VAM real 4-D temperature/salinity cache.
- [x] Integrated INCOIS OSF real surface U/V current cache.
- [x] Removed production fixture/old CMEMS demo fields.
- [ ] Remaining: deploy-time/server-side HYCOM subset adapter for true numerical-model volume fields; local VM lacks disk for the full ~9.9 GB file.



---

# SOURCE: `docs/DATA-CUBE-ARCHITECTURE.md`

# Ocean data-cube architecture

The application treats ocean products as labeled multidimensional coverages rather than independent visual layers.

## Canonical dimensions

`time × depth × latitude × longitude × variable`

Each representation is a projection, slice, drill-down, or derived operation over that cube:

- Globe: surface slice at the selected time/depth.
- Depth slice: `depth = z` reduction.
- Volume: bounded `lat/lon/depth` sub-cube uploaded to a WebGL 3-D texture.
- Section: transect/depth sampling over the same cube.
- Isosurface: derived level set over the volume.
- Currents: paired U/V range fields sharing the same spatial domain.
- Argo: point observations joined to the cube by time, horizontal position and depth.

The backend therefore exposes cube subsetting on `/api/fields/{field}/cube` and the volume endpoint through latitude, longitude, depth and stride parameters. The browser receives only the requested cube, not the source NetCDF archive.

This follows the established geoscience coverage/data-cube model: xarray provides labeled N-D arrays and coordinate-aware selection/alignment, while OGC Coverage/WCS concepts model space/time-varying multidimensional fields and explicit domain/range metadata.



---

# SOURCE: `docs/OGC-CF-INTEROPERABILITY.md`

# OGC / CF interoperability contract

## Decision

The service exposes the ocean cube through two complementary interfaces:

- **WCS 2.0.1** at `/ogc/wcs` for machine access to multidimensional coverage values and coordinate subsets.
- **WMS 1.3.0** at `/ogc/wms` for 2-D map portrayal.
- The existing `/api/fields/*` REST API remains the application-native analytical API; it is not presented as an OGC service.

WCS is the data-access interface because a coverage retains the semantics of a space/time-varying field, while WMS is the portrayal interface. This follows the OGC distinction between WCS data retrieval and WMS rendered maps.

## CF contract

NetCDF ingestion uses xarray with CF decoding enabled. The normalized scalar field preserves:

- `depth` as positive-down metres;
- `latitude` as `degrees_north`;
- `longitude` as `degrees_east`;
- `time` as the source valid time;
- `Conventions` from the source dataset;
- source/institution and product identifiers;
- missing values as an explicit mask internally.

WCS `GetCoverage` returns a NetCDF subset with CF-style coordinate metadata and the original source `Conventions` value.

## WMS axis-order rule

For WMS 1.3.0:

- `CRS=EPSG:4326` uses the formal latitude,longitude BBOX axis order.
- `CRS=CRS:84` uses longitude,latitude order.

The service rejects other CRSs rather than silently reprojecting.

## Scope

This is an interoperability implementation for the prototype, not an assertion of OGC compliance certification. The endpoints intentionally implement the operations needed by the demonstrator: WCS `GetCapabilities`, `DescribeCoverage`, `GetCoverage`, and WMS `GetCapabilities`, `GetMap`.

## Why both interfaces exist

The browser's 3-D renderer needs native numerical values and dimensions, so it should query WCS/coverage data rather than scrape a rendered WMS image. GIS clients can consume WMS directly for familiar 2-D maps and WCS for coverage subsets.



---

# SOURCE: `docs/decisions/ADR-001-ogc-cf-coverage-interfaces.md`

# ADR-001: Use OGC WCS/WMS with CF-NetCDF for ocean coverage interoperability

## Status
Accepted

## Context

The platform must interoperate with INCOIS and other ocean-data systems without coupling the visualization layer to one provider. The core data is multidimensional ocean coverage data: time, depth, latitude, longitude and scientific variables.

## Decision

Expose normalized ocean scalar fields through WCS 2.0.1 for coverage access and WMS 1.3.0 for 2-D portrayal. Preserve CF coordinate and provenance metadata when ingesting and returning NetCDF.

The native REST API remains the application-specific query interface for analytical operations such as cube subsets, profiles and derived visualizations.

## Alternatives considered

### WMS only
Rejected because WMS returns portrayal images, not the multidimensional numerical coverage needed for 3-D volume rendering and scientific analysis.

### WCS only
Rejected because existing GIS and operational workflows commonly consume 2-D map portrayals through WMS.

### Provider-specific APIs only
Rejected because they make the client dependent on INCOIS-specific schemas and make future Copernicus/other providers unnecessarily expensive to integrate.

## Consequences

- GIS clients can discover and render the service using WMS.
- Scientific clients can request spatial/depth subsets through WCS.
- The browser can consume numerical subsets without downloading whole source archives.
- CF metadata remains part of the scientific contract.
- Full conformance certification still requires running the relevant OGC abstract test suites; this prototype does not claim certification.



---

# SOURCE: `docs/SIH26067-PROJECT-REQUIREMENTS-ASD-STE100.md`

# SIH26067 Ocean Data Visualization Platform
## Project Requirements Document (PRD)

**Problem Statement:** 26067  
**Problem Statement Title:** Develop a web-based interactive 3D visualization platform that integrates numerical ocean model outputs and in-situ observations.  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** Indian National Centre for Ocean Information Services (INCOIS) Ocean Valley  
**Category:** Software  
**Theme:** Disaster Management  
**Document status:** Engineering baseline  
**Date:** 2026-08-29  
**Language basis:** ASD-STE100 Simplified Technical English, Issue 9 (January 2025)

---

## 1. Purpose

This document defines the requirements for SIH26067.

The system shall provide a browser-based platform for the analysis and visualization of multidimensional ocean data. The system shall combine numerical ocean model fields with in-situ observations. The system shall support operational analysis, scientific inspection, and public science communication.

The source Problem Statement requires 3-D visualization, instrument overlays, NetCDF and text ingestion, variable and color controls, a scalable web architecture, open standards, and an extensible design. fileciteturn0file0L5-L8

The document uses controlled technical language. ASD-STE100 is a controlled natural language with writing rules and a controlled dictionary. The current standard is Issue 9, January 2025. citeturn0search7turn0search58

---

## 2. Scope

### 2.1 In scope

The system shall provide:

1. A 3-D geographic ocean globe.
2. Multidimensional scalar-field visualization.
3. Surface field visualization as a continuous geographic heatmap texture.
4. Horizontal depth-slice visualization.
5. 3-D volume visualization.
6. Isosurface visualization.
7. Time navigation and time-step animation.
8. Variable selection.
9. Color palette selection.
10. Value range selection.
11. Linear and logarithmic color scaling.
12. Layer opacity control.
13. Vertical exaggeration control.
14. Current-field visualization from U and V components.
15. Argo observation markers.
16. Glider observation markers.
17. CTD observation markers.
18. BGC observation markers.
19. Observation selection and inspection.
20. Depth-versus-variable profile plots.
21. Model-versus-observation comparison.
22. Data provenance and quality metadata.
23. NetCDF ingestion.
24. Delimited text ingestion.
25. CF-aware metadata handling.
26. REST query interfaces.
27. OGC WMS interface.
28. OGC WCS interface.
29. OPeNDAP-compatible source access where provided by the source service.
30. Modular source adapters.
31. Modular sensor adapters.
32. Browser-side GPU rendering.
33. Server-side data subsetting.
34. Render-resolution and level-of-detail control.
35. Scientific data validation.
36. Development diagnostics.
37. Deployment on INCOIS infrastructure without a required client installation.

### 2.2 Out of scope for the first complete prototype

The following items are not required for the first complete prototype unless the project owner adds them:

- Full global high-resolution volume rendering at native source resolution.
- Client-side storage of complete source NetCDF archives.
- Machine-learning derived products.
- Full operational alert generation.
- Automatic advisory generation.
- Full terrain rendering.
- Full digital twin functionality.
- Automatic scientific interpretation of every anomaly.

The architecture shall allow these functions to be added later.

---

## 3. Problem Definition

INCOIS produces large ocean datasets. These datasets contain temperature, salinity, current vectors, chlorophyll and other variables. The datasets can contain several depth levels, spatial grids and time steps. INCOIS also receives observations from Argo floats, Gliders and other instruments.

The current problem is the lack of one browser-based system that can show these fields and observations together. The system shall reduce the need to move between separate applications.

The system shall make it possible to answer questions such as:

- What is the state of the selected ocean variable at a selected depth and time?
- How does the field change with depth?
- How does the field change with time?
- Where are important gradients or structures?
- Where are current pathways?
- What does an Argo profile show at a selected location?
- How does the model value compare with an observation?
- What source and quality information applies to the displayed value?

---

## 4. Scientific Data Model

### 4.1 Canonical data cube

The system shall use a normalized multidimensional field model.

The canonical scalar cube shall be represented as:

`time × depth × latitude × longitude`

A variable shall be associated with the cube metadata.

A vector field shall use paired components:

`U(time, depth, latitude, longitude)`  
`V(time, depth, latitude, longitude)`

Observation data shall use a point/profile model with time, latitude, longitude, depth, variable, value, quality state and source metadata.

### 4.2 Coordinate rules

The normalized model shall define:

- latitude as degrees north;
- longitude as degrees east;
- depth as metres, positive downward;
- time as an explicit valid time;
- missing data as an explicit mask;
- source grid order as explicit metadata;
- vertical coordinate direction as explicit metadata.

The system shall not infer coordinate direction from array order alone.

### 4.3 CF metadata

The ingestion service shall preserve CF metadata where the source provides it.

The service shall support CF-aware decoding of time, packed values, scale factors, offsets and coordinate metadata. xarray provides CF decoding for NetCDF data and supports packed values through `scale_factor` and `add_offset`. citeturn0search1turn0search3

OGC identifies CF-netCDF as a standard family for multidimensional space/time-varying geospatial information. citeturn0search0turn0search4

---

## 5. Source Data Requirements

### 5.1 Numerical model data

The system shall support numerical ocean model data as a primary source class.

The first production-quality model adapter shall support an INCOIS numerical model source. The current engineering research has verified INCOIS RSMC HYCOM as the numerical-model target. The architecture shall obtain spatial, depth and time subsets from the source. The complete source file shall not be required on the browser host.

### 5.2 INCOIS analysed fields

The system may use INCOIS objectively analysed Argo-derived temperature and salinity fields for analysis and demonstration. The UI shall identify these fields as analysed fields and shall not label them as numerical forecasts.

### 5.3 Current fields

The system shall support surface and depth-resolved U/V current fields. The UI shall identify the source, valid time, vertical level and product type.

### 5.4 Observations

The system shall support:

- Argo;
- Glider;
- CTD;
- BGC;
- future mooring data;
- future HF-radar data;
- future ADCP data.

Each source adapter shall map source metadata to the common observation contract.

### 5.5 Remote data access

The system shall support remote subsetting where the source service supports it.

INCOIS ERDDAP `griddap` supports URL-based subsets of gridded datasets and uses OPeNDAP access mechanisms. INCOIS also documents ERDDAP as a service for subsets of large scientific datasets. citeturn1search0turn1search2turn1search9

The architecture shall prefer remote subset access over complete archive download when the source supports suitable access.

---

## 6. Functional Requirements

### FR-001 Globe

The system shall display a geographic Earth globe.

The globe shall use a verified geographic texture and correct longitude orientation.

The system shall place data using latitude and longitude coordinates. East and west shall not be inverted.

### FR-002 Scalar surface field

The system shall display a selected scalar field on the geographic globe as a continuous heatmap texture.

The texture shall use the selected time and depth.

The rendering resolution may exceed the source grid resolution for display quality. The UI shall state when the display uses interpolation.

### FR-003 Depth slice

The system shall display a horizontal slice at the selected depth.

The slice shall use the actual selected depth coordinate from the source field.

The slice shall remain geographically registered.

### FR-004 Volume rendering

The system shall display a selected bounded 3-D scalar field as a volume.

The renderer shall use a 3-D GPU texture or an equivalent GPU representation.

The renderer shall support:

- transfer function;
- opacity;
- value range;
- early ray termination;
- empty-space reduction where feasible;
- level of detail;
- depth exaggeration.

The system shall not require the browser to download the complete source archive.

### FR-005 Isosurface

The system shall extract an isosurface from a selected scalar volume.

The isosurface shall be generated from scalar values. It shall not use random points as a representation of an isosurface.

The system shall display the isosurface in geographic 3-D coordinates.

The system shall show the globe or a geographic reference layer below the isosurface when this does not reduce visual clarity.

### FR-006 Currents

The system shall display U/V current fields as a flow representation.

The first flow representation shall use streamlines or animated particles. Sparse vector glyphs may be used as a secondary quantitative representation.

The system shall support:

- seed density;
- flow direction;
- current magnitude;
- animation speed;
- depth selection;
- time selection.

### FR-007 Time

The system shall allow the user to select a valid time.

The system shall provide time-step navigation.

The system shall support time animation.

The UI shall show the valid time of the selected field.

### FR-008 Depth

The system shall allow the user to select a valid source depth.

The UI shall show the exact selected depth.

The system shall not create unsupported depth levels without identifying the interpolation method.

### FR-009 Variable controls

The system shall allow the user to select supported variables.

Each variable shall provide:

- name;
- standard name where available;
- units;
- valid range;
- source;
- product type;
- time coverage;
- depth coverage.

### FR-010 Color controls

The system shall provide:

- color palette selection;
- minimum value;
- maximum value;
- linear scale;
- logarithmic scale where scientifically valid;
- opacity.

The colorbar shall show numerical values and units.

### FR-011 Instrument overlay

The system shall display geospatially accurate instrument markers.

A user shall be able to select a marker.

The system shall show the source, platform, cycle, time, position and available variables.

### FR-012 Profile view

The system shall display depth-versus-variable profiles for selected instruments.

The profile shall show timestamps where available.

The profile shall identify missing and quality-controlled values.

### FR-013 Model-observation comparison

The system shall support a comparison between a selected model field and an observation profile.

For each comparison point, the service shall provide:

- observation value;
- model value;
- difference;
- observation time;
- model valid time;
- observation position;
- model position or interpolation position;
- observation depth;
- model depth or vertical interpolation;
- interpolation method;
- quality state.

### FR-014 Data inspection

The system shall allow a user to inspect a selected data value.

The inspector shall show the numeric value. It shall not require the user to infer a value from a color.

### FR-015 Provenance

The system shall show:

- source organization;
- dataset name;
- product name;
- variable;
- valid time;
- source update time where available;
- native grid resolution;
- selected grid resolution;
- interpolation method;
- quality-control status;
- cache status.

### FR-016 Scientific validation

The backend shall validate every ingested field before it becomes available to the renderer.

The validation shall check:

- coordinate monotonicity;
- coordinate range;
- time validity;
- depth direction;
- dimension order;
- units;
- missing-value encoding;
- source metadata;
- field range;
- invalid values;
- mask consistency.

### FR-017 Data cube query

The backend shall support subset queries by:

- variable;
- time;
- depth;
- latitude range;
- longitude range;
- spatial stride or level of detail.

The browser shall receive only the required subset.

### FR-018 Multi-format ingestion

The system shall ingest NetCDF data.

The system shall ingest delimited text data.

The ingestion system shall use adapters so that a new source does not require changes to the rendering code.

### FR-019 OGC WMS

The service shall expose a WMS interface for map portrayal.

WMS shall not be the primary numerical data path for 3-D rendering.

### FR-020 OGC WCS

The service shall expose a WCS interface for coverage access.

WCS shall support multidimensional coverage subsets where supported by the implementation. OGC defines WCS as a service for access to multidimensional coverage data, including space/time-varying grids and other coverage forms. citeturn0search6

### FR-021 OPeNDAP

The source layer shall support OPeNDAP-compatible services where the source provides them.

The browser shall not be required to implement OPeNDAP directly.

### FR-022 Extensibility

New variables and new observation types shall be added through source adapters and schema definitions.

The rendering engine shall use the common field contract and shall not contain source-specific logic.

---

## 7. Analytical Functions

The complete prototype shall support the following analytical operations over the data cube.

### AF-001 Slice

Select one depth and display the corresponding horizontal field.

### AF-002 Time slice

Select one valid time and display the corresponding field.

### AF-003 Volume

Select a bounded 3-D spatial and depth domain and display the scalar field.

### AF-004 Isosurface

Select a value threshold and display the corresponding level surface.

### AF-005 Point query

Select a geographic point and return the field value through depth and time.

### AF-006 Vertical profile

Return a vertical profile at a selected geographic position.

### AF-007 Horizontal transect

Return values along a selected horizontal path.

### AF-008 Model-observation join

Join an observation profile to a model field by time, position and depth.

### AF-009 Difference

Calculate observation minus model value at valid comparison points.

### AF-010 Range and statistics

Provide minimum, maximum, mean, median and valid-cell count for the selected field subset.

### AF-011 Gradient

Provide horizontal and vertical gradient products where the source grid supports valid derivative calculations.

### AF-012 Current magnitude and direction

Calculate current speed and direction from U and V.

### AF-013 Flow integration

Generate streamlines or particle trajectories from U/V fields.

### AF-014 Temporal change

Calculate change between selected valid times where the source supports comparable fields.

All derived products shall identify the input field, operation and time/depth range.

---

## 8. Architecture Requirements

### 8.1 Architecture model

The system shall use the following layers:

```text
Source services and files
        |
        v
Source adapters
        |
        v
CF-aware normalization
        |
        v
Scientific data cube
        |
        +------------------+
        |                  |
        v                  v
Query / subset API     OGC services
        |
        v
Render-ready chunks
        |
        v
Browser analytical engine
        |
        +------------------------------+
        |              |               |
        v              v               v
Globe          Scalar render       Vector render
        |
        v
Interaction / inspection / analysis
```

### 8.2 Backend

The backend shall use Python and FastAPI or an equivalent supported web framework.

The backend shall use xarray or an equivalent CF-aware array system.

The backend shall support NetCDF and chunked array access.

Zarr may be used as an internal chunked representation when it improves random access and cache behavior.

The backend shall not place large 4-D arrays in a relational database.

A relational database may store catalog and observation metadata.

### 8.3 Frontend

The frontend shall use a modern JavaScript framework and TypeScript.

The renderer shall use WebGL2 and Three.js or an equivalent GPU framework.

`globe.gl` may provide geographic globe behavior and geographic layers. Custom Three.js layers shall provide analytical rendering where required.

### 8.4 Data access

The system shall use subset queries and chunked transfer.

The browser shall not download a multi-gigabyte source model file for normal operation.

### 8.5 Level of detail

The system shall support at least three data/render levels:

1. Overview.
2. Interactive analysis.
3. Detailed inspection.

The level shall be selected from the requested spatial, depth and temporal extent and the target renderer.

---

## 9. Performance Requirements

### PR-001 Initial load

The application shall show the geographic globe before large analytical data loads.

### PR-002 Incremental data

Analytical data shall load after the base globe is ready.

### PR-003 Data transfer

The application shall request only the selected field subset.

### PR-004 GPU memory

The browser shall not allocate a 3-D texture that exceeds a tested device memory budget.

### PR-005 Volume rendering

The volume renderer shall use early ray termination and shall reduce unnecessary samples where possible.

### PR-006 Flow rendering

The current renderer shall use controlled seed density and shall not create one independent scene object for every source vector.

### PR-007 Cache

Common queries shall be cached where source terms permit it.

### PR-008 Failure handling

A failed source request shall not leave the application in an unexplained blank state. The UI shall show the failed operation and source.

---

## 10. Scientific Integrity Requirements

### SI-001 Source identity

Every field shall identify its source.

### SI-002 Product type

The UI shall distinguish:

- numerical model output;
- objective analysis;
- observation;
- derived product;
- visualization interpolation.

### SI-003 Native resolution

The UI shall show native source resolution.

### SI-004 Display resolution

The UI shall show display resolution when it differs from native resolution.

### SI-005 Interpolation

The UI shall identify interpolation when a displayed value is not a direct source grid value.

### SI-006 Quality control

Observation values shall preserve source quality-control flags where available.

### SI-007 Masking

The renderer shall not display masked data as valid scientific values.

### SI-008 Range validation

The backend shall run range checks and shall report suspicious values without silently changing the source value.

### SI-009 Reproducibility

A data view shall be reproducible from its source, query parameters, rendering settings and application version.

### SI-010 Scientific disclaimer

The system shall not state that an interpolated or analysed value is a direct observation.

---

## 11. Security and Deployment Requirements

The system shall be deployable on INCOIS infrastructure.

The system shall keep source credentials on the server.

The browser shall not receive source credentials.

The system shall support HTTPS deployment.

The system shall support configurable source endpoints.

The system shall provide health and readiness endpoints.

The system shall log source failures and query failures without logging secrets.

---

## 12. Testing Requirements

### 12.1 Unit tests

The project shall test:

- coordinate normalization;
- depth normalization;
- time normalization;
- missing-value handling;
- field statistics;
- interpolation;
- current magnitude and direction;
- isosurface extraction;
- color scaling.

### 12.2 API tests

The project shall test:

- metadata;
- slice query;
- volume query;
- point query;
- observation query;
- profile query;
- WMS;
- WCS.

### 12.3 Browser tests

The project shall test:

- globe orientation;
- field load;
- depth change;
- time change;
- variable change;
- colorbar change;
- volume view;
- isosurface view;
- current flow;
- instrument selection;
- profile display;
- provenance display.

### 12.4 Scientific acceptance tests

A test dataset with known values shall be used to verify that:

- east and west are correct;
- north and south are correct;
- depth is positive down;
- time selection is correct;
- source values match query values;
- renderer values match query values;
- masks are preserved;
- units are preserved.

---

## 13. User Interface Requirements

The interface shall provide a clear hierarchy:

```text
DATASET
  -> VARIABLE
    -> TIME
      -> DEPTH
        -> VIEW
          -> ANALYSIS
            -> INSPECTION
```

The main screen shall contain:

1. geographic globe;
2. variable controls;
3. time controls;
4. depth controls;
5. visualization mode controls;
6. colorbar;
7. numeric value range;
8. instrument overlay controls;
9. right-side information inspector;
10. provenance information;
11. optional development diagnostics.

The UI shall not use a visual encoding without a numeric explanation for scientific values.

---

## 14. Data Source and Standards Interfaces

### 14.1 NetCDF

NetCDF shall be the primary file interchange format for gridded ocean data.

### 14.2 CF

CF metadata shall define coordinate and variable semantics where available.

### 14.3 OGC WMS

WMS shall provide map portrayal.

### 14.4 OGC WCS

WCS shall provide numerical coverage access.

### 14.5 OGC API

The architecture should allow future migration or addition of OGC API building blocks. OGC API Common provides reusable building blocks for OGC Web API standards. citeturn0search14

### 14.6 ERDDAP / OPeNDAP

ERDDAP and OPeNDAP shall be source access mechanisms when the source provides them.

---

## 15. Acceptance Criteria for the Complete Prototype

The prototype shall be accepted when all of the following are true:

1. A user can select a real ocean field.
2. The globe displays the field at the correct geographic location.
3. The user can change time.
4. The user can change depth.
5. The user can view a depth slice.
6. The user can view a bounded 3-D volume.
7. The user can create a real isosurface.
8. The user can view current flow.
9. The user can select an observation.
10. The user can inspect a profile.
11. The user can compare a model field with an observation.
12. The system shows source and quality metadata.
13. The system shows numeric color ranges.
14. The system identifies interpolation.
15. The system exposes WMS and WCS interfaces.
16. The system accepts a supported NetCDF source.
17. The system can query remote subsets without downloading a complete multi-gigabyte archive.
18. Browser tests pass for the main analysis workflow.
19. Scientific validation tests pass for coordinate, depth, time and mask handling.
20. The system can run on INCOIS infrastructure.

---

## 16. Delivery Plan

### Phase 1 — Scientific data foundation

- Complete source inventory.
- Complete CF normalization.
- Complete source validation.
- Implement subset query.
- Implement provenance contract.
- Implement scientific sanity checks.

### Phase 2 — Core globe and scalar views

- Geographic globe.
- Continuous surface heatmap.
- Depth slice.
- Time control.
- Colorbar.
- Numeric value inspection.

### Phase 3 — 3-D analytical views

- GPU volume renderer.
- Transfer function.
- Vertical exaggeration.
- Isosurface extraction.
- Level-of-detail control.

### Phase 4 — Vector analysis

- U/V normalization.
- Current magnitude and direction.
- Streamlines.
- Particle flow.
- Current animation.

### Phase 5 — Observation integration

- Argo.
- Glider.
- CTD.
- BGC.
- Profile inspector.
- Model-observation join.
- Delta analysis.

### Phase 6 — Standards and deployment

- WMS.
- WCS.
- OPeNDAP source adapters.
- Deployment configuration.
- Authentication and secret handling.
- Monitoring.

### Phase 7 — Validation and demonstration

- Scientific validation.
- Browser validation.
- Performance validation.
- Accessibility review.
- Public outreach mode.
- Operational forecaster workflow.
- Final demonstration scenario.

---

## 17. Traceability to Problem Statement

| PS requirement | PRD coverage |
|---|---|
| 3-D volumetric rendering | FR-004, FR-005 |
| Temperature, salinity, currents | FR-002, FR-006, FR-009 |
| Depth slices | FR-003 |
| Isosurface extraction | FR-005 |
| Time-step animation | FR-007 |
| Argo and Glider | FR-011, FR-012 |
| CTD and BGC | FR-011 |
| NetCDF and text | FR-018 |
| Colorbar controls | FR-010 |
| Variable controls | FR-009 |
| Opacity | FR-010 |
| Vertical exaggeration | FR-004 |
| REST/OPeNDAP | FR-017, FR-021 |
| OGC WMS/WCS | FR-019, FR-020 |
| Extensibility | FR-022 |
| INCOIS deployment | Section 11 |
| Science communication | Section 15 and UI requirements |

The source PS identifies the same core areas: 3-D model fields, in-situ overlays, NetCDF/text ingestion, variable and color controls, REST/OPeNDAP access, extensibility, OGC WMS/WCS and CF interoperability. fileciteturn0file0L5-L8

---

## 18. References

1. SIH26067 Problem Statement 26067, Ministry of Earth Sciences / INCOIS. 
2. ASD-STE100 Simplified Technical English, Issue 9, January 2025. 
3. OGC NetCDF Standards Suite.
4. OGC Web Coverage Service (WCS).
5. OGC API - Common.
6. INCOIS ERDDAP griddap documentation.
7. xarray NetCDF and CF I/O documentation.
8. Project research record: `research.md`.
9. Project architecture record: `docs/DATA-CUBE-ARCHITECTURE.md`.
10. Project interoperability record: `docs/OGC-CF-INTEROPERABILITY.md`.



---

# SOURCE: `docs/SIH26067-IMPLEMENTATION-STATUS-AND-ROADMAP-ASD-STE100.md`

# SIH26067 Ocean Data Visualization Platform
## Implementation Status and Remaining Work

**Problem Statement:** 26067  
**Status date:** 2026-08-29  
**Language basis:** ASD-STE100 Simplified Technical English, Issue 9 (January 2025)

---

## 1. Purpose

This document records what the project has implemented, what has been verified, what remains incomplete, and what work shall follow.

It is a project status record. It does not replace the Project Requirements Document.

---

## 2. Current Project Position

The project has moved from a prototype globe toward a scientific data-cube architecture.

The current architecture treats the ocean field as a multidimensional coverage:

`time × depth × latitude × longitude × variable`

The visual views are projections or derived operations over this cube.

The project now contains:

- a React and TypeScript frontend;
- a FastAPI backend;
- a CF-aware data ingestion boundary;
- an OGC WMS/WCS boundary;
- INCOIS data adapters;
- Argo observation support;
- a geographic globe based on `globe.gl`;
- scalar heatmap rendering;
- experimental depth, volume and isosurface paths;
- current-field rendering;
- an observation inspector;
- scientific provenance information;
- a development render-state panel;
- backend and frontend tests.

The project is **not yet complete** against the full PS.

---

## 3. Problem Statement Baseline

The PS requires a web-based 3-D platform that integrates numerical ocean model output with in-situ observations. It specifically requires temperature, salinity and currents; depth slices; isosurfaces; time animation; Argo/Glider/CTD/BGC overlays; NetCDF and text ingestion; color controls; a scalable REST/OPeNDAP architecture; OGC WMS/WCS and CF interoperability; and an extensible design. fileciteturn0file0L5-L8

This project therefore has two separate goals:

1. build a correct scientific data path;
2. build a useful visual and analytical interface over that data path.

Both goals are required.

---

## 4. Work Completed

### 4.1 Initial failure triage

The first application failure was traced to a stale server process. The frontend requested `/api/fields`, while an older prototype process was serving the request.

The server process was replaced with the current application.

This established the first important rule for the project:

> A browser visualization shall be tested against the active development server, not only against source code or build output.

### 4.2 Prototype field replacement

The earlier temperature field was a prototype/Argo-derived surface representation.

The project removed that production path and replaced it with an INCOIS 4-D temperature/salinity field for the analysis views.

The current documentation identifies these fields as INCOIS ARGO Monthly Variational Analysis fields. They are objective analyses, not numerical forecasts.

### 4.3 Salinity

The project replaced the old single surface salinity representation with a depth-resolved field.

The normalized architecture uses:

`time × depth × latitude × longitude`

The current INCOIS VAM data contains multiple depth levels.

### 4.4 Currents

The old current layer used vertical velocity and was therefore not a correct surface-current representation.

The project replaced it with INCOIS Ocean State Forecast U/V surface-current data.

The current architecture treats currents as a vector field, not as a scalar field.

### 4.5 Geographic globe

The project changed the globe from a basic wireframe/heatmap arrangement to a geographic globe.

`globe.gl` is now used as the geographic globe layer.

The project also corrected the longitude orientation problem. The previous rendering placed the Bay of Bengal and Arabian Sea on the wrong sides of India.

The current geographic rule is:

```text
Arabian Sea  <-  India  ->  Bay of Bengal
west              east
```

### 4.6 Earth texture

The project added Earth textures and corrected the static texture serving path.

The project found that an Earth texture request was receiving the application HTML through the SPA fallback. This prevented the globe texture from loading.

The asset path was corrected.

### 4.7 Scalar heatmap

The project changed the scalar surface representation from separate geographic tiles to a continuous heatmap texture.

This was a major improvement.

The current surface renderer uses a high-resolution display raster and places the scalar field on the geographic globe.

The display raster is an interpolation of the native field. It does not create new scientific observations.

The current UI also exposes the numerical color range.

### 4.8 Depth slice

A depth-slice path exists.

The intended operation is:

```text
4-D field
   |
   +-- select time
   +-- select depth
   |
   v
latitude × longitude field
   |
   v
geographic display
```

This path requires further browser validation before it can be marked complete.

### 4.9 Volume

A WebGL2 3-D texture path exists.

The renderer uses a bounded volume rather than the full source archive.

The intended operation is:

```text
time × depth × latitude × longitude
                 |
                 v
          selected sub-cube
                 |
                 v
             Data3DTexture
                 |
                 v
            ray marching
```

This path requires further scientific and browser validation before it can be marked complete.

### 4.10 Isosurface

The project replaced the earlier random threshold point-cloud concept with actual surface extraction logic.

The intended operation is:

```text
3-D scalar field
       |
       v
selected threshold
       |
       v
marching tetrahedra
       |
       v
triangle surface
```

The current implementation requires further browser validation and scientific acceptance testing.

### 4.11 Currents

The project moved from sparse vector glyphs toward flow visualization.

The current direction is to use streamlines or animated particles as the primary representation.

The project shall keep vector glyphs as a possible secondary quantitative view.

### 4.12 Instrument markers

The project has live Argo marker support.

The current browser state has shown live Argo observations rather than only a fixed small set.

A selected observation can be shown in the right-side inspector.

### 4.13 Profile inspection

The project contains profile inspection components.

The backend also contains an Argo adapter and model-observation comparison logic.

This is a strong foundation for the required observation-analysis workflow.

### 4.14 OGC interfaces

The project has an OGC interoperability boundary.

The project documents:

- WMS 1.3.0 for map portrayal;
- WCS 2.0.1 for coverage access;
- CF-aware NetCDF handling.

The project does not claim OGC conformance certification.

OGC defines WCS as a service for multidimensional coverage access. OGC also defines CF-netCDF standards for multidimensional geospatial data. citeturn0search6turn0search0

### 4.15 Data-cube architecture

The project now has `docs/DATA-CUBE-ARCHITECTURE.md`.

The design treats each view as a data-cube operation rather than as an independent visualization.

Current conceptual mapping:

```text
DATA CUBE
    |
    +-- Globe        -> surface selection
    |
    +-- Depth slice  -> depth reduction
    |
    +-- Volume       -> bounded 3-D sub-cube
    |
    +-- Isosurface   -> level-set operation
    |
    +-- Currents     -> U/V vector field
    |
    +-- Argo         -> point/profile join
```

This is the correct foundation for future analytical functions.

### 4.16 Development diagnostics

The project now has a scientific render-state panel.

It exposes values such as:

- view;
- field;
- source;
- time index;
- depth;
- grid shape;
- value range;
- opacity;
- vertical exaggeration;
- current grid information.

This addresses a major project problem: browser failures must be observable.

### 4.17 Tests and commits

The project has backend tests for API, Argo, ingestion, live adapters, models and scientific functions.

The frontend has volume tests.

Recent engineering commits include:

- `b8f8c48` — scientific ocean world architecture;
- `f116047` — real INCOIS data and 3-D views;
- `9b532f1` — geographic cube corrections;
- `190b4c3` — OGC WMS/WCS interfaces;
- `01e99d8` — globe rendering and analytical overlays;
- `659ae2c` — globe heatmap and view repair;
- `7713db7` — scalar and flow visualization rebuild;
- `f96b4b0` — scalar range and render-state information.

---

## 5. Data Source Status

### 5.1 INCOIS VAM temperature and salinity

**Status:** available for the current demonstrator.

**Type:** objectively analysed Argo-derived field.

**Important:** this shall not be described as a numerical forecast.

### 5.2 INCOIS OSF currents

**Status:** available for the current demonstrator.

**Type:** operational current field with U/V components.

### 5.3 Argo

**Status:** live observation adapter available.

INCOIS ERDDAP provides gridded subset access through `griddap` and OPeNDAP mechanisms. ERDDAP is designed to provide subsets of large scientific datasets rather than require users to download complete archives. citeturn1search0turn1search2

### 5.4 INCOIS numerical HYCOM

**Status:** verified as the target numerical-model source; full source archive is not stored locally.

The project research identified a current INCOIS RSMC HYCOM file of approximately 9.9 GB. The source contains temperature, salinity, U and V variables and multiple depth levels.

The correct architecture is therefore:

```text
INCOIS HYCOM
     |
     | remote subset
     v
server adapter
     |
     v
small render-ready cube
     |
     v
browser
```

The browser shall not download the full HYCOM file.

### 5.5 Copernicus

The project research also identified Copernicus Marine as a possible external source and fallback. The architecture keeps source adapters modular.

Copernicus shall not replace the INCOIS-first requirement for the core demonstration.

---

## 6. Important Scientific Finding

The project must distinguish data accuracy from visualization accuracy.

A real source dataset can still produce a wrong display if the application uses:

- wrong longitude direction;
- wrong latitude direction;
- wrong depth order;
- wrong time index;
- wrong fill value;
- wrong scale factor;
- wrong unit;
- wrong interpolation;
- wrong mask;
- wrong field variable.

This is why the project shall implement a scientific validation pipeline before the final demonstration.

### Example: deep temperature

A red color at 2000 m is not enough to conclude that the value is wrong.

The color may only represent the high end of the selected color scale.

The application must show the numeric value and source metadata.

The Bay of Bengal has areas deeper than 2000 m, so 2000 m is a valid ocean depth in the region. The scientific question is therefore the actual value at the selected position and time, not the color alone.

### Example: salinity at depth

A deep salinity maximum can be physically valid because different water masses and mixing processes can create subsurface salinity structure.

The application shall not decide that a value is wrong from visual appearance alone.

### Example: year-to-year salinity

An objective analysis is not equal to a complete set of direct measurements at every grid cell.

The analysis combines observations and an analysis method.

The UI shall identify this distinction.

---

## 7. Current Gaps

The following items are not yet complete.

### G-001 Numerical model hot path

The INCOIS HYCOM adapter shall be completed so that the application can query small server-side subsets from the numerical model.

### G-002 Scientific validation

The project shall compare selected source values against normalized values and displayed values.

### G-003 Depth view validation

The depth-slice browser workflow shall be validated with known test values.

### G-004 Volume view validation

The volume renderer shall be validated with a known synthetic volume and then with real data.

### G-005 Isosurface validation

The isosurface shall be validated against synthetic shapes with known geometry before real ocean data acceptance.

### G-006 Current flow validation

The current renderer shall be validated against a synthetic vector field with known flow direction.

### G-007 Current density control

The user shall be able to increase or reduce streamline/particle density.

### G-008 Model-observation comparison

The model field shall be sampled at observation time, position and depth with explicit interpolation metadata.

### G-009 Observation expansion

Glider, CTD and BGC adapters are still required.

### G-010 Analytical functions

Point query, transect, statistics, gradients, anomaly/change and flow integration require completion.

### G-011 Time animation

The complete time animation workflow requires validation against real source time steps.

### G-012 OGC validation

The existing WMS/WCS implementation shall be tested against appropriate conformance tests before a conformance claim is made.

### G-013 Performance validation

Target hardware and browser performance limits are not yet established.

### G-014 LOD and chunking

A formal multi-resolution data strategy is required for larger fields.

### G-015 User workflow

The final user workflow needs a clearer hierarchy from dataset selection to analytical operation.

---

## 8. Next Engineering Sequence

The project shall not add new visual effects before the scientific data path is stable.

### Step 1 — Scientific field audit

For each supported field:

1. read source metadata;
2. record dimensions;
3. record coordinate ranges;
4. record coordinate direction;
5. record depth levels;
6. record time intervals;
7. record units;
8. record fill values;
9. calculate value statistics;
10. compare selected raw values with normalized values.

### Step 2 — Point-query truth path

Implement one authoritative point query:

```text
source
  -> normalized value
  -> API value
  -> browser inspector value
```

The three values shall be traceable.

### Step 3 — Depth slice

Make the depth slice fully reliable before volume work.

### Step 4 — Volume

Use a known synthetic volume to validate ray marching. Then validate a real field.

### Step 5 — Isosurface

Use a known synthetic sphere and scalar field to validate extraction. Then validate an ocean field.

### Step 6 — Currents

Use a synthetic circular and uniform flow field. Verify streamline direction and magnitude. Then use INCOIS U/V.

### Step 7 — Observation join

Use an Argo profile and sample the model at its actual position, time and depth.

### Step 8 — Scientific UI

Expose:

- value;
- units;
- source;
- product type;
- time;
- depth;
- native resolution;
- interpolation;
- QC;
- mask state.

### Step 9 — LOD and remote data

Implement server-side subset and multi-resolution chunks.

### Step 10 — OGC and deployment

Validate WMS/WCS and prepare INCOIS deployment.

### Step 11 — Final demonstration

Use a real analysis scenario:

```text
select temperature
     |
select time
     |
inspect surface
     |
move to depth
     |
inspect volume
     |
select current field
     |
follow flow
     |
select Argo
     |
inspect profile
     |
compare model and observation
     |
inspect provenance
```

---

## 9. Proposed Final Concept Hierarchy

The final product shall use a hierarchy based on the scientific data cube.

```text
                         OCEAN DATA CUBE
                                |
        +-----------------------+-----------------------+
        |                       |                       |
      SCALAR                  VECTOR               OBSERVATION
        |                       |                       |
   +----+----+              U + V              +-------+-------+
   |         |                 |                |       |       |
surface     depth          flow field        Argo   Glider   CTD/BGC
   |         |
   |      +--+---------+
   |      |            |
 slice  volume     isosurface
   |      |            |
   +------+------------+
          |
      ANALYSIS
          |
 +--------+---------+----------+----------+
 |        |         |          |          |
point  profile   transect   statistics  change
 |        |         |          |          |
 +--------+---------+----------+----------+
          |
       COMPARISON
          |
      model vs obs
          |
      provenance/QC
```

This hierarchy shall remain the main architecture principle.

The visual view is not the product by itself. The view is a way to inspect and analyze a scientific data cube.

---

## 10. Definition of Done

The project is complete for the PS when:

- real numerical model data can be queried without full archive download;
- temperature and salinity work through the common field contract;
- currents use valid U/V data;
- the globe is geographically correct;
- surface fields use a continuous heatmap;
- depth slices work;
- volumes work;
- isosurfaces work;
- current flow works;
- time animation works;
- Argo, Glider, CTD and BGC data can be displayed;
- profiles can be inspected;
- model and observation values can be compared;
- numerical values and provenance are visible;
- NetCDF and delimited text ingestion work;
- WMS and WCS work;
- CF metadata is preserved;
- remote subset access works;
- LOD prevents oversized browser transfers;
- browser tests pass;
- scientific validation tests pass;
- deployment works on INCOIS infrastructure;
- the public outreach view explains the data source and the limits of the analysis.

---

## 11. References

- SIH26067 Problem Statement 26067.
- ASD-STE100 Simplified Technical English, Issue 9, January 2025.
- INCOIS ERDDAP documentation.
- OGC NetCDF standards.
- OGC WCS standard.
- OGC API Common.
- xarray NetCDF and CF documentation.
- `research.md` in this repository.
- `docs/DATA-CUBE-ARCHITECTURE.md` in this repository.
- `docs/OGC-CF-INTEROPERABILITY.md` in this repository.



---

# SOURCE: `docs/superpowers/specs/2026-08-28-sih26067-capability-map.md`

# SIH26067 Capability Map

| Module | Responsibility | Depends on |
|---|---|---|
| scientific-core | canonical field model, normalization, LOD, interpolation | — |
| source-adapters | Argo ERDDAP and NetCDF/Copernicus adapters | scientific-core |
| query-api | REST contracts and render/query responses | scientific-core, source-adapters |
| renderer | Three.js scene, volume/slice rendering, picking | scientific-core |
| analysis-ui | controls, profile inspector, comparison and provenance | query-api, renderer |
| verification | unit, integration, E2E and visual smoke checks | all modules |

Build order: scientific-core → source-adapters → query-api → renderer → analysis-ui → verification/polish.



---

# SOURCE: `docs/superpowers/specs/2026-08-28-sih26067-ocean-analysis-design.md`

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



---

# SOURCE: `docs/superpowers/plans/2026-08-28-sih26067-mvp.md`

# SIH26067 Ocean Analysis MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a real-data-shaped SIH26067 vertical slice: scientific field API → WebGL depth/volume renderer → Argo marker → profile/model comparison.

**Architecture:** Python/FastAPI owns scientific data normalization and query contracts; React/TypeScript owns interaction and Three.js owns the focal GPU scene. The first demo uses deterministic fixture data shaped like Copernicus/Argo and has isolated live Argo acquisition so judging remains reliable.

**Tech Stack:** Python 3.12, FastAPI, Pydantic, NumPy, xarray/SciPy when available, React, TypeScript, Vite, Three.js, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-28-sih26067-ocean-analysis-design.md`

## Global Constraints
- Port: `9000` for the public application entrypoint requested by the user.
- Browser receives normalized render payloads, never raw NetCDF.
- Positive-down depth convention in the canonical model.
- Real/cached/live provenance must be explicit.
- TDD for production behavior: failing test before implementation.
- No credentials in source control.
- One focal WebGL renderer.

---

## Task 1: Repository foundation and contracts

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/models.py`
- Create: `backend/tests/test_models.py`

**Interfaces:**
- Produces Pydantic models: `FieldMetadata`, `SliceResponse`, `VolumeResponse`, `ObservationMarker`, `ProfileResponse`, `ComparisonResponse`, `APIError`.

- [ ] Write failing model validation tests.
- [ ] Run `cd backend && python -m pytest tests/test_models.py -v`; expected initial import/model failures.
- [ ] Implement the models and validation rules.
- [ ] Re-run focused tests; expected PASS.
- [ ] Initialize git and commit foundation.

## Task 2: Scientific field engine

**Files:**
- Create: `backend/app/scientific.py`
- Create: `backend/tests/test_scientific.py`
- Modify: `backend/app/models.py`

**Interfaces:**
- `build_fixture_field()` -> `ScalarField`
- `make_slice(field, depth_index, lod)` -> `SliceResponse`
- `make_volume(field, lod)` -> `VolumeResponse`
- `sample_field(field, lat, lon, depth)` -> `SampleResult`

- [ ] Write failing tests for coordinate normalization, positive-down depth, LOD dimensions, missing values and interpolation.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement the minimal NumPy-based field engine.
- [ ] Run tests; expected PASS.
- [ ] Commit.

## Task 3: Argo adapter and deterministic fixture

**Files:**
- Create: `backend/app/argo.py`
- Create: `backend/app/fixtures.py`
- Create: `backend/tests/test_argo.py`
- Create: `data/demo/argo_profile.json`

**Interfaces:**
- `parse_argo_csv(text)` -> `list[ObservationProfile]`
- `fetch_argo_profile(platform, cycle)` -> `ObservationProfile`
- `fixture_profiles()` -> `list[ObservationProfile]`

- [ ] Write failing parser tests using the verified Argo CSV shape.
- [ ] Run focused tests and verify failures.
- [ ] Implement parser with strict column/number validation and NaN handling.
- [ ] Add fixture generated from the previously verified Argo profile.
- [ ] Run tests; expected PASS.
- [ ] Commit.

## Task 4: FastAPI query surface

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/tests/test_api.py`
- Modify: `backend/app/models.py`, `backend/app/scientific.py`, `backend/app/argo.py`

**Interfaces:**
- `GET /api/health`
- `GET /api/datasets`
- `GET /api/fields/temperature/metadata`
- `GET /api/fields/temperature/slice`
- `GET /api/fields/temperature/volume`
- `GET /api/fields/temperature/point`
- `GET /api/observations`
- `GET /api/observations/{platform}/{cycle}/profile`
- `GET /api/comparisons/profile`

- [ ] Write failing API tests for response shapes and invalid parameters.
- [ ] Run focused tests and verify failures.
- [ ] Implement routes with consistent error envelopes.
- [ ] Run API tests and OpenAPI generation check; expected PASS.
- [ ] Commit.

## Checkpoint: Backend vertical slice
- [ ] `cd backend && python -m pytest -q` passes.
- [ ] `uvicorn app.main:app --host 0.0.0.0 --port 9000` starts.
- [ ] `/api/health`, `/api/fields/temperature/slice`, and `/api/observations` respond.

## Task 5: Frontend foundation

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

**Interfaces:**
- App renders a full-screen analysis workspace and reads backend base URL from `VITE_API_BASE_URL` with same-origin default.

- [ ] Add frontend tests for app boot and API base resolution.
- [ ] Verify the tests fail before implementation.
- [ ] Scaffold Vite React TypeScript and minimal app shell.
- [ ] Run tests/build; expected PASS.
- [ ] Commit.

## Task 6: Three.js renderer spike

**Files:**
- Create: `frontend/src/components/OceanScene.tsx`
- Create: `frontend/src/lib/volume.ts`
- Create: `frontend/src/lib/volume.test.ts`
- Modify: `frontend/package.json`

**Interfaces:**
- `createVolumeTexture(volume)` -> `THREE.Data3DTexture`
- `normalizeScalarRange(values, min, max, scale)` -> `Float32Array`
- `OceanScene` accepts `VolumeResponse`, camera settings and render mode.

- [ ] Write failing tests for scalar normalization and missing-value conversion.
- [ ] Verify RED.
- [ ] Implement texture conversion and a minimal Three.js scene.
- [ ] Add depth-slice mode first.
- [ ] Add WebGL2 volume mode using a bounded 3D texture and ray-march shader.
- [ ] Build and run the renderer smoke test; measure nonblank canvas and FPS on the VM/browser environment available.
- [ ] If volume mode fails the performance gate, keep slice mode as fallback and record the measured result before changing architecture.
- [ ] Commit.

## Task 7: Analysis workspace UI

**Files:**
- Create: `frontend/src/components/ControlPanel.tsx`
- Create: `frontend/src/components/ProvenancePanel.tsx`
- Create: `frontend/src/components/ProfileInspector.tsx`
- Create: `frontend/src/components/ColorScale.tsx`
- Create: `frontend/src/styles/app.css`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Controls update renderer state without recreating the WebGL context.
- `ProfileInspector` accepts `ProfileResponse` and optional `ComparisonResponse`.

- [ ] Write component tests for control state and profile rendering.
- [ ] Verify RED.
- [ ] Implement responsive instrument-console UI, keyboard-accessible controls and explicit loading/error/cached states.
- [ ] Run unit tests and build.
- [ ] Commit.

## Task 8: End-to-end integration and visual QA

**Files:**
- Create: `frontend/tests/ocean-flow.spec.ts`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/src/lib/api.ts`
- Modify: `frontend/src/App.tsx`, `frontend/src/components/OceanScene.tsx`

**Interfaces:**
- `getFieldSlice`, `getFieldVolume`, `getObservations`, `getProfile`, `getComparison` are typed API client functions.

- [ ] Write E2E test for load → render → depth change → click marker → profile/comparison.
- [ ] Verify RED.
- [ ] Implement API client and interaction wiring.
- [ ] Run E2E at desktop and one mobile viewport.
- [ ] Capture screenshot evidence and verify console health/nonblank canvas.
- [ ] Commit.

## Task 9: Real Argo live path and NetCDF ingestion

**Files:**
- Create: `backend/app/ingestion.py`
- Create: `backend/app/config.py`
- Create: `backend/tests/test_ingestion.py`
- Create: `scripts/fetch_argo.py`

- [ ] Write failing tests for delimited text and NetCDF adapter contracts.
- [ ] Verify RED.
- [ ] Implement optional xarray-backed NetCDF reader and Argo ERDDAP fetch path.
- [ ] Run tests with and without optional scientific dependencies.
- [ ] Verify one live Argo request and record source metadata.
- [ ] Commit.

## Task 10: Deployment on host-forwarded port 9000

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `frontend/nginx.conf`
- Modify: `backend/app/main.py`

- [ ] Build the production image.
- [ ] Start the stack bound to `0.0.0.0:9000` in the VM.
- [ ] Verify `curl http://127.0.0.1:9000/api/health` and the root page from inside the VM.
- [ ] Verify the forwarded host-facing endpoint using the environment's reachable address/path if available.
- [ ] Commit.

## Checkpoint: MVP
- [ ] Backend tests pass.
- [ ] Frontend tests/build pass.
- [ ] E2E smoke passes.
- [ ] 3D renderer is nonblank and interactive.
- [ ] Main model/observation flow is demonstrated with provenance.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| WebGL2 volume performance | High | bounded LOD, slice fallback, measure early |
| Missing scientific packages | High | optional extras plus deterministic NumPy fixture engine |
| Live source instability | High | pinned fixture + explicit live adapter |
| Coordinate/depth errors | High | canonical model + unit tests |
| UI becomes dashboard-like | Medium | scene-first console layout and focused workflow |
| Scope creep | High | temperature vertical slice before salinity/currents/OGC |

## Task List
See the numbered tasks above; checkpoints are explicit.

