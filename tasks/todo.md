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
