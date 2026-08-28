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
