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
