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
