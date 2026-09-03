import {lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {ControlPanel} from './components/ControlPanel'
import {getComparison,getFields,getObservations,getProfile,getSlice,getVolume,getCurrents,getTimes,type ComparisonResponse,type FieldCatalogItem,type ObservationMarker,type ProfileResponse,type SliceResponse,type VectorFieldResponse,type VolumeResponse} from './lib/api'
import './styles/app.css'

const OceanScene=lazy(()=>import('./components/OceanScene').then(m=>({default:m.OceanScene})))
export type View='globe'|'slice'|'volume'|'iso'|'currents'

function useDebounced<T>(value:T,delay:number){
  const[debounced,setDebounced]=useState(value)
  useEffect(()=>{const id=window.setTimeout(()=>setDebounced(value),delay);return()=>window.clearTimeout(id)},[value,delay])
  return debounced
}

function formatTime(value?:string){return value?value.replace('T',' ').replace(/:00Z$/,' UTC'):'—'}
function scalarRange(data:SliceResponse|VolumeResponse|null,field:FieldCatalogItem|null){
  if(!data)return {min:field?.color_min??0,max:field?.color_max??1}
  return {min:data.bounds.min,max:data.bounds.max}
}
function currentRange(data:VectorFieldResponse|null){
  if(!data)return {min:0,max:1}
  let min=Infinity,max=0
  for(let i=0;i<data.u.length;i++){const u=data.u[i],v=data.v[i];if(Number.isFinite(u)&&Number.isFinite(v)){const s=Math.hypot(u,v);if(s<=5){min=Math.min(min,s);max=Math.max(max,s)}}}
  return {min:Number.isFinite(min)?min:0,max:max||1}
}

export default function App(){
  const[fields,setFields]=useState<FieldCatalogItem[]>([])
  const[field,setField]=useState('temperature')
  const[view,setView]=useState<View>('globe')
  const[times,setTimes]=useState<string[]>([])
  const[timeIndex,setTimeIndex]=useState(0)
  const[depth,setDepth]=useState(0)
  const[volume,setVolume]=useState<VolumeResponse|null>(null)
  const[slice,setSlice]=useState<SliceResponse|null>(null)
  const[currents,setCurrents]=useState<VectorFieldResponse|null>(null)
  const[obs,setObs]=useState<ObservationMarker[]>([])
  const[showObs,setShowObs]=useState(true)
  const[selected,setSelected]=useState<ObservationMarker|null>(null)
  const[profile,setProfile]=useState<ProfileResponse|null>(null)
  const[comparison,setComparison]=useState<ComparisonResponse|null>(null)
  const[error,setError]=useState('')
  const[loading,setLoading]=useState(false)
  const[requestCount,setRequestCount]=useState(0)
  const[cacheHits,setCacheHits]=useState(0)
  const depthRequest=useDebounced(depth,140)
  const timeRequest=useDebounced(timeIndex,140)
  const cacheRef=useRef(new Set<string>())

  useEffect(()=>{Promise.all([getFields(),getObservations()]).then(([f,o])=>{setFields(f);setObs(o)}).catch(e=>setError(e.message))},[])

  useEffect(()=>{
    let alive=true
    setError('')
    getTimes(field).then(ts=>{if(alive){setTimes(ts);setTimeIndex(i=>Math.min(i,Math.max(0,ts.length-1)))}}).catch(e=>alive&&setError(e.message))
    return()=>{alive=false}
  },[field])

  useEffect(()=>{
    let alive=true
    const key=view==='currents'?'currents':`${field}:${view}:${depthRequest}:${timeRequest}`
    const cached=cacheRef.current.has(key)
    if(cached)setCacheHits(v=>v+1)
    setLoading(!cached)
    if(view==='currents'){
      getCurrents().then(v=>alive&&setCurrents(v)).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setLoading(false))
      return()=>{alive=false}
    }
    const scalarView=view==='globe'||view==='slice'
    const request=scalarView?getSlice(field,view==='globe'?0:depthRequest,2,timeRequest):getVolume(field,2,timeRequest)
    request.then(data=>{
      if(!alive)return
      cacheRef.current.add(key)
      if(scalarView)setSlice(data as SliceResponse)
      else setVolume(data as VolumeResponse)
    }).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setLoading(false))
    setRequestCount(v=>v+1)
    return()=>{alive=false}
  },[field,view,depthRequest,timeRequest])

  const select=useCallback((m:ObservationMarker)=>{
    setSelected(m)
    Promise.all([getProfile(m.platform,m.cycle),getComparison(m.platform,m.cycle,field)])
      .then(([p,c])=>{setProfile(p);setComparison(c)})
      .catch(e=>setError(e.message))
  },[field])

  const changeField=(value:string)=>{setField(value);setSelected(null);setProfile(null);setComparison(null)}
  const current=fields.find(f=>f.id===field)??null
  const scalar=scalarRange(view==='volume'||view==='iso'?volume:slice,current)
  const range=view==='currents'?currentRange(currents):scalar
  const activeTime=view==='currents'?currents?.valid_time:times[timeIndex]
  const depthMax=current?.id==='salinity'||current?.id==='temperature'?Math.max(2000,Number(slice?.depth??2000)):2000
  const statusText=error?'SOURCE ERROR':loading?'REQUESTING DATA':'SOURCE CONNECTED'
  const statusClass=error?'error-status':loading?'loading-status':'connected'
  const displayedObs=showObs?obs:[]

  const info=useMemo(()=>({
    field:view==='currents'?'Surface Currents':current?.label??'Ocean field',
    units:view==='currents'?'m s⁻¹':current?.units??'—',
    source:view==='currents'?currents?.source:current?.source,
    time:activeTime,
    depth:view==='globe'?0:depth,
    min:range.min,max:range.max,
  }),[view,current,currents,activeTime,depth,range.min,range.max])

  return <main className="app">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">O</div><div><strong>OCEAN ANALYSIS CONSOLE</strong><small>SIH26067 · MVP</small></div></div>
      <div className="status"><span className={`status-dot ${statusClass}`}/>{statusText}<span className="status-sep"/>INCOIS / ARGO<span className="status-sep"/>{activeTime?formatTime(activeTime):'DATA TIME —'}</div>
    </header>

    <div className="workspace">
      <ControlPanel fields={fields.filter(f=>f.id!=='currents')} field={field} setField={changeField} view={view} setView={setView} depth={depth} setDepth={setDepth} depthMax={depthMax} times={times} timeIndex={timeIndex} setTimeIndex={setTimeIndex} observations={obs} selected={selected} onSelect={select} showObservations={showObs} setShowObservations={setShowObs}/>

      <section className="viewport">
        <div className="viewport-title">
          <div><span className="eyebrow">{view==='globe'?'GLOBAL VIEW':view==='slice'?'DEPTH SLICE':view==='volume'?'3D VOLUME':view==='iso'?'ISOSURFACE':'SURFACE FLOW'}</span><h1>{info.field}</h1><p>{info.source??'Loading source…'} · {info.units} · {formatTime(info.time)}</p></div>
        </div>
        {loading&&<div className="data-progress"><span/>UPDATING FIELD</div>}
        {error&&<div className="error">{error}</div>}
        <Suspense fallback={<div className="loading">INITIALIZING 3D ENGINE…</div>}>
          <OceanScene view={view} field={current} volume={volume} slice={slice} currents={currents} observations={displayedObs} selected={selected} opacity={.82} exaggeration={1} onSelect={select}/>
        </Suspense>

        <aside className="data-stack">
          <section className="data-card">
            <div className="card-title">DATA INFO</div>
            <div className="kv"><span>Field</span><b>{info.field}</b></div>
            <div className="kv"><span>Units</span><b>{info.units}</b></div>
            <div className="kv"><span>Source</span><b>{info.source??'—'}</b></div>
            <div className="kv"><span>Time</span><b>{formatTime(info.time)}</b></div>
            <div className="kv"><span>Depth</span><b>{info.depth} m</b></div>
            <div className="kv"><span>Min / Max</span><b>{info.min.toFixed(2)} / {info.max.toFixed(2)} {info.units}</b></div>
          </section>
          <section className="data-card argo-card">
            <div className="card-title">ARGO / INSTRUMENTS</div>
            <div className="argo-summary"><span>Total</span><b>{obs.length}</b><span>Displayed</span><b>{displayedObs.length}</b></div>
            {selected&&<div className="selected-mini"><span>SELECTED</span><b>{selected.platform}</b><small>{selected.latitude.toFixed(3)}° · {selected.longitude.toFixed(3)}° · cycle {selected.cycle}</small></div>}
          </section>
          <section className="data-card legend-card">
            <div className="card-title">LEGEND</div>
            <div className="legend-name">{info.field.toUpperCase()} <span>({info.units})</span></div>
            <div className={`legend-gradient ${view==='currents'?'current-gradient':''}`}/>
            <div className="legend-ticks"><span>{info.min.toFixed(1)}</span><span>{((info.min+info.max)/2).toFixed(1)}</span><span>{info.max.toFixed(1)}</span></div>
            <div className="legend-extents"><span>Min: {info.min.toFixed(2)} {info.units}</span><span>Max: {info.max.toFixed(2)} {info.units}</span></div>
            {view==='currents'&&<div className="vector-key"><i/> direction · magnitude</div>}
          </section>
        </aside>
        <div className="scene-hint">DRAG = ROTATE &nbsp; | &nbsp; SCROLL = ZOOM &nbsp; | &nbsp; R = RESET</div>
        <div className="render-status">REQUEST QUEUE: {loading?'1':'0'} &nbsp; | &nbsp; CACHE HITS: {cacheHits} &nbsp; | &nbsp; REQUESTS: {requestCount}</div>
      </section>
    </div>
  </main>
}
