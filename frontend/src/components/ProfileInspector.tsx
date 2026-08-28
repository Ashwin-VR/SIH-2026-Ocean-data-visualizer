import type { ComparisonResponse, ProfileResponse } from '../lib/api'

type Props = { profile: ProfileResponse | null; comparison: ComparisonResponse | null; loading: boolean }

export function ProfileInspector({ profile, comparison, loading }: Props) {
  if (loading) return <section className="inspector"><div className="eyebrow">PROFILE INSPECTOR</div><p className="muted">Sampling model and observation profile…</p></section>
  if (!profile) return <section className="inspector"><div className="eyebrow">PROFILE INSPECTOR</div><p className="muted">Select an Argo marker to inspect its water-column profile.</p></section>
  const maxDepth = Math.max(...profile.points.map((point) => point.depth), 1)
  const points = comparison?.points ?? profile.points.map((point) => ({ ...point, model: null, delta: null }))
  return (
    <section className="inspector" aria-label="Profile inspector">
      <div className="inspector-head"><div><div className="eyebrow">PROFILE INSPECTOR</div><h2>ARGO {profile.platform}</h2><p>Cycle {profile.cycle} · {new Date(profile.timestamp).toLocaleString()}</p></div><div className="coordinate">{profile.latitude.toFixed(3)}°N / {profile.longitude.toFixed(3)}°E</div></div>
      <div className="profile-grid">
        <div className="profile-chart" aria-label="Depth profile comparison">
          <div className="chart-axis">DEPTH ↓</div>
          {points.map((point) => {
            const observed = point.observed == null ? null : Math.max(0, Math.min(1, (point.observed - 15) / 16))
            const model = point.model == null ? null : Math.max(0, Math.min(1, (point.model - 15) / 16))
            return <div className="profile-row" key={point.depth}><span>{Math.round(point.depth)}m</span><div className="track"><i className="obs-line" style={{ left: `${(observed ?? 0) * 100}%` }} /><i className="model-line" style={{ left: `${(model ?? 0) * 100}%` }} /></div></div>
          })}
          <div className="chart-legend"><span><i className="legend-observed" /> OBSERVED</span><span><i className="legend-model" /> MODEL</span></div>
        </div>
        <div className="comparison-table-wrap">
          <table><thead><tr><th>DEPTH</th><th>OBS</th><th>MODEL</th><th>Δ</th></tr></thead><tbody>{points.map((point) => <tr key={point.depth}><td>{point.depth.toFixed(0)}m</td><td>{point.observed?.toFixed(2) ?? '—'}</td><td>{point.model?.toFixed(2) ?? '—'}</td><td className={point.delta != null && Math.abs(point.delta) > 0.5 ? 'alert' : ''}>{point.delta == null ? '—' : `${point.delta > 0 ? '+' : ''}${point.delta.toFixed(2)}`}</td></tr>)}</tbody></table>
          <div className="method">INTERPOLATION <strong>{comparison?.interpolation ?? '—'}</strong> · MODEL VALID <strong>{comparison?.model_valid_time ?? '—'}</strong> · MAX DEPTH <strong>{maxDepth.toFixed(0)} m</strong></div>
        </div>
      </div>
    </section>
  )
}
