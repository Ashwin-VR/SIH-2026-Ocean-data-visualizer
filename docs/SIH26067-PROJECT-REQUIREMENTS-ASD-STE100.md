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
