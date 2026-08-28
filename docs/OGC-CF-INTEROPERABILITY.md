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
