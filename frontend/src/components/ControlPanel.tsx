import type {FieldCatalogItem,ObservationMarker} from '../lib/api'
import type {View} from '../App'

type Props={fields:FieldCatalogItem[];field:string;setField:(v:string)=>void;view:View;setView:(v:View)=>void;depth:number;setDepth:(v:number)=>void;depthMax:number;times:string[];timeIndex:number;setTimeIndex:(v:number)=>void;observations:ObservationMarker[];selected:ObservationMarker|null;onSelect:(m:ObservationMarker)=>void;showObservations:boolean;setShowObservations:(v:boolean)=>void}
const views:[View,string,string][]=[['globe','GLOBE','Whole ocean'],['slice','DEPTH SLICE','Horizontal slice'],['volume','VOLUME','3D field'],['iso','ISOSURFACE','Threshold surface'],['currents','CURRENTS','Surface flow']]
export function ControlPanel(p:Props){return <aside className="control-panel">
  <section className="control-section first-section"><div className="section-heading"><span>1. FIELD</span></div><select value={p.field} onChange={e=>p.setField(e.target.value)}>{p.fields.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></section>
  <section className="control-section"><div className="section-heading"><span>2. VIEW</span></div><div className="view-list">{views.map(([id,title,help])=><button key={id} className={`view-button ${p.view===id?'active':''}`} onClick={()=>p.setView(id)}><span>{title}</span><small>{help}</small></button>)}</div></section>
  {p.view!=='currents'&&<section className="control-section">
    <div className="section-heading"><span>3. TIME</span><b>{p.times[p.timeIndex]?.slice(0,10)??'—'}</b></div>
    <input className="range" type="range" min="0" max={Math.max(0,p.times.length-1)} value={p.timeIndex} onChange={e=>p.setTimeIndex(+e.target.value)} disabled={!p.times.length}/>
    <div className="range-labels"><span>Earlier</span><span>Later</span></div>
    <div className="play-row"><button onClick={()=>p.setTimeIndex(Math.max(0,p.timeIndex-1))}>|&lt;</button><button onClick={()=>p.setTimeIndex(Math.max(0,p.timeIndex-1))}>&lt;&lt;</button><button onClick={()=>p.setTimeIndex(Math.min(p.times.length-1,p.timeIndex+1))}>&gt;&gt;</button><button onClick={()=>p.setTimeIndex(Math.min(p.times.length-1,p.timeIndex+1))}>&gt;|</button></div>
  </section>}
  {p.view!=='currents'&&<section className="control-section"><div className="section-heading"><span>4. DEPTH</span><b>{p.depth} m {p.depth===0?'(Surface)':''}</b></div><input className="range" type="range" min="0" max={p.depthMax} step="25" value={p.depth} onChange={e=>p.setDepth(+e.target.value)}/><div className="range-labels depth-labels"><span>0m</span><span>1000m</span><span>2000m</span><span>3000m</span><span>4000m</span><span>5000m</span></div></section>}
  <section className="control-section"><div className="section-heading"><span>5. VISUAL</span></div><button className={p.showObservations?'toggle active':'toggle'} onClick={()=>p.setShowObservations(!p.showObservations)}><span className="toggle-mark">{p.showObservations?'✓':''}</span>Show Argo / instruments</button></section>
  {p.observations.length>0&&<section className="control-section"><div className="section-heading"><span>ARGO PROFILES</span><b>{p.observations.length}</b></div><div className="obs-list">{p.observations.slice(0,10).map(m=><button key={`${m.platform}-${m.cycle}`} className={p.selected?.platform===m.platform?'obs selected':'obs'} onClick={()=>p.onSelect(m)}><i/><span><strong>{m.platform}</strong><small>Cycle {m.cycle}</small></span></button>)}</div></section>}
</aside>}
