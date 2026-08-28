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
