import type { ObservationMarker } from '../lib/api'

type Props = {
  mode: 'volume' | 'slice'
  setMode: (mode: 'volume' | 'slice') => void
  depth: number
  setDepth: (depth: number) => void
  opacity: number
  setOpacity: (value: number) => void
  exaggeration: number
  setExaggeration: (value: number) => void
  selected: ObservationMarker | null
  observations: ObservationMarker[]
  onSelect: (marker: ObservationMarker) => void
}

export function ControlPanel(props: Props) {
  const { mode, setMode, depth, setDepth, opacity, setOpacity, exaggeration, setExaggeration, selected, observations, onSelect } = props
  return (
    <aside className="control-panel" aria-label="Ocean controls">
      <div className="eyebrow">FIELD CONTROLS</div>
      <label className="field-label" htmlFor="variable">Variable</label>
      <select id="variable" defaultValue="temperature" aria-label="Variable">
        <option value="temperature">Temperature · °C</option>
        <option value="salinity" disabled>Salinity · PSU (next)</option>
        <option value="currents" disabled>Currents · m/s (next)</option>
      </select>

      <div className="segmented" role="group" aria-label="Visualization mode">
        <button className={mode === 'volume' ? 'active' : ''} onClick={() => setMode('volume')}>VOLUME</button>
        <button className={mode === 'slice' ? 'active' : ''} onClick={() => setMode('slice')}>DEPTH SLICE</button>
      </div>

      <label className="field-label" htmlFor="depth">Depth <strong>{depth} m</strong></label>
      <input id="depth" type="range" min="0" max="1000" step="25" value={depth} onChange={(event) => setDepth(Number(event.target.value))} />

      <label className="field-label" htmlFor="opacity">Opacity <strong>{Math.round(opacity * 100)}%</strong></label>
      <input id="opacity" type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />

      <label className="field-label" htmlFor="exaggeration">Vertical exaggeration <strong>{exaggeration.toFixed(1)}×</strong></label>
      <input id="exaggeration" type="range" min="0.4" max="2.5" step="0.1" value={exaggeration} onChange={(event) => setExaggeration(Number(event.target.value))} />

      <div className="section-divider" />
      <div className="eyebrow">OBSERVATIONS</div>
      <div className="obs-list">
        {observations.map((marker) => (
          <button key={`${marker.platform}-${marker.cycle}`} className={`obs-row ${selected?.platform === marker.platform ? 'selected' : ''}`} onClick={() => onSelect(marker)}>
            <span className="obs-dot" />
            <span><strong>{marker.platform}</strong><small>Cycle {marker.cycle} · {marker.sensor}</small></span>
          </button>
        ))}
      </div>
    </aside>
  )
}
