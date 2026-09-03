import type {FieldCatalogItem,ObservationMarker} from '../lib/api'
import type {View} from '../App'

type Props={fields:FieldCatalogItem[];field:string;setField:(v:string)=>void;view:View;setView:(v:View)=>void;depth:number;setDepth:(v:number)=>void;opacity:number;setOpacity:(v:number)=>void;exaggeration:number;setExaggeration:(v:number)=>void;times:string[];timeIndex:number;setTimeIndex:(v:number)=>void;observations:ObservationMarker[];selected:ObservationMarker|null;onSelect:(m:ObservationMarker)=>void;showObservations:boolean;setShowObservations:(v:boolean)=>void}

const views:[View,string,string][]=[['globe','Globe','Whole ocean'],['slice','Depth','Horizontal slice'],['volume','Volume','3D field'],['iso','Isosurface','Threshold surface'],['currents','Currents','Surface flow']]

export function ControlPanel(p:Props){
  return <aside className="control-panel">
    <div className="rail-intro"><span className="eyebrow">EXPLORE THE OCEAN</span><p>Choose a view, then adjust only what that view needs.</p></div>

    <section className="control-section">
      <label>FIELD<select value={p.field} onChange={e=>p.setField(e.target.value)}>{p.fields.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
    </section>

    <section className="control-section">
      <div className="section-heading"><span>VIEW</span></div>
      <div className="view-list">{views.map(([id,title,help])=><button key={id} className={p.view===id?'view-button active':'view-button'} onClick={()=>p.setView(id)}><span>{title}</span><small>{help}</small></button>)}</div>
    </section>

    {p.view!=='currents'&&<section className="control-section">
      <div className="section-heading"><span>TIME</span><b>{p.times[p.timeIndex]?.slice(0,10)??'—'}</b></div>
      <input className="range" type="range" min="0" max={Math.max(0,p.times.length-1)} value={p.timeIndex} onChange={e=>p.setTimeIndex(+e.target.value)} disabled={!p.times.length}/>
      <div className="range-labels"><span>Earlier</span><span>Later</span></div>

      <div className="section-heading depth-heading"><span>DEPTH</span><b>{p.depth} m</b></div>
      <input className="range" type="range" min="0" max="2000" step="25" value={p.depth} onChange={e=>p.setDepth(+e.target.value)} />
    </section>}

    <section className="control-section">
      <div className="section-heading"><span>DISPLAY</span></div>
      {p.view!=='currents'&&<><div className="slider-row"><span>Field opacity</span><b>{Math.round(p.opacity*100)}%</b></div><input className="range" type="range" min=".15" max="1" step=".05" value={p.opacity} onChange={e=>p.setOpacity(+e.target.value)}/><div className="slider-row"><span>Vertical scale</span><b>{p.exaggeration.toFixed(1)}×</b></div><input className="range" type="range" min=".5" max="4" step=".1" value={p.exaggeration} onChange={e=>p.setExaggeration(+e.target.value)} disabled={p.view==='globe'||p.view==='slice'}/></>}
      <button className={p.showObservations?'toggle active':'toggle'} onClick={()=>p.setShowObservations(!p.showObservations)}><span className="toggle-mark">{p.showObservations?'✓':''}</span>Show Argo observations</button>
    </section>

    {p.observations.length>0&&<section className="control-section observations-section">
      <div className="section-heading"><span>ARGO PROFILES</span><b>{p.observations.length}</b></div>
      <div className="obs-list">{p.observations.slice(0,12).map(m=><button key={`${m.platform}-${m.cycle}`} className={p.selected?.platform===m.platform?'obs selected':'obs'} onClick={()=>p.onSelect(m)}><i/><span><strong>{m.platform}</strong><small>Cycle {m.cycle}</small></span></button>)}</div>
    </section>}
  </aside>
}
