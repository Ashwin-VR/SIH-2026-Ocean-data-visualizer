import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
const OceanScene = lazy(() => import('./components/OceanScene').then((module) => ({ default: module.OceanScene })))
import { ProfileInspector } from './components/ProfileInspector'
import { ProvenancePanel } from './components/ProvenancePanel'
import { getComparison, getObservations, getProfile, getSlice, getVolume, type ComparisonResponse, type ObservationMarker, type ProfileResponse, type SliceResponse, type VolumeResponse } from './lib/api'
import './styles/app.css'

export default function App() {
  const [mode, setMode] = useState<'volume' | 'slice'>('volume')
  const [depth, setDepth] = useState(100)
  const [opacity, setOpacity] = useState(0.82)
  const [exaggeration, setExaggeration] = useState(1.2)
  const [volume, setVolume] = useState<VolumeResponse | null>(null)
  const [slice, setSlice] = useState<SliceResponse | null>(null)
  const [observations, setObservations] = useState<ObservationMarker[]>([])
  const [selected, setSelected] = useState<ObservationMarker | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getVolume(2), getObservations(), getSlice(depth, 2)]).then(([nextVolume, nextObservations, nextSlice]) => {
      setVolume(nextVolume); setObservations(nextObservations); setSlice(nextSlice); setError(null)
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load ocean field')).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (mode !== 'slice') return
    getSlice(depth, 2).then(setSlice).catch((err) => setError(err instanceof Error ? err.message : 'Unable to update depth slice'))
  }, [depth, mode])

  const selectObservation = useCallback((marker: ObservationMarker) => {
    setSelected(marker)
    setProfile(null)
    setComparison(null)
    Promise.all([getProfile(marker.platform, marker.cycle), getComparison(marker.platform, marker.cycle)])
      .then(([nextProfile, nextComparison]) => { setProfile(nextProfile); setComparison(nextComparison) })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to inspect observation'))
  }, [])

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark">O</span><div><strong>OCEAN ANALYSIS</strong><small>SIH26067 · 3D SITUATIONAL CONSOLE</small></div></div><div className="top-status"><span className="live-dot" /> FIELD ONLINE <b>INDIAN OCEAN</b></div></header>
      <div className="workspace">
        <ControlPanel mode={mode} setMode={setMode} depth={depth} setDepth={setDepth} opacity={opacity} setOpacity={setOpacity} exaggeration={exaggeration} setExaggeration={setExaggeration} selected={selected} observations={observations} onSelect={selectObservation} />
        <section className="scene-stage"><div className="scene-caption"><span className="eyebrow">{mode === 'volume' ? '3D VOLUME' : 'DEPTH SLICE'}</span><strong>TEMPERATURE FIELD</strong><small>45°E–105°E · 5°S–22°N · 0–1000 m</small></div>{loading && <div className="scene-state">INITIALIZING FIELD…</div>}{error && <div className="scene-state error">{error}</div>}<Suspense fallback={<div className="scene-state">LOADING GPU RENDERER…</div>}><OceanScene volume={volume} slice={slice} mode={mode} opacity={opacity} verticalExaggeration={exaggeration} selected={selected} observations={observations} onSelect={selectObservation} /></Suspense><div className="scale"><span>15°C</span><i /><span>31°C</span></div></section>
      </div>
      <div className="lower-band"><ProfileInspector profile={profile} comparison={comparison} loading={selected != null && profile == null} /><ProvenancePanel /></div>
    </main>
  )
}
