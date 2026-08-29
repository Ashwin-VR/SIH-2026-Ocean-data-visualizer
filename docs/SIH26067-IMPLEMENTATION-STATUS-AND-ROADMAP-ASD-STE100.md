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
