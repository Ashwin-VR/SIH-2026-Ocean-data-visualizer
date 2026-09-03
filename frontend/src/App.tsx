import {lazy,Suspense,useCallback,useEffect,useState} from 'react'
import {ControlPanel} from './components/ControlPanel'
import {RightInspector} from './components/RightInspector'
import {DebugPanel} from './components/DebugPanel'
import {getComparison,getFields,getObservations,getProfile,getSlice,getVolume,getCurrents,getTimes,type ComparisonResponse,type FieldCatalogItem,type ObservationMarker,type ProfileResponse,type SliceResponse,type VectorFieldResponse,type VolumeResponse} from './lib/api'
import './styles/app.css'

const OceanScene=lazy(()=>import('./components/OceanScene').then(m=>({default:m.OceanScene})))
export type View='globe'|'slice'|'volume'|'iso'|'currents'

export default function App(){
  const[fields,setFields]=useState<FieldCatalogItem[]>([])
  const[field,setField]=useState('temperature')
  const[view,setView]=useState<View>('globe')
  const[times,setTimes]=useState<string[]>([])
  const[timeIndex,setTimeIndex]=useState(0)
  const[depth,setDepth]=useState(100)
  const[opacity,setOpacity]=useState(.72)
  const[exaggeration,setExaggeration]=useState(1.25)
  const[volume,setVolume]=useState<VolumeResponse|null>(null)
  const[slice,setSlice]=useState<SliceResponse|null>(null)
  const[currents,setCurrents]=useState<VectorFieldResponse|null>(null)
  const[obs,setObs]=useState<ObservationMarker[]>([])
  const[showObs,setShowObs]=useState(true)
  const[selected,setSelected]=useState<ObservationMarker|null>(null)
  const[profile,setProfile]=useState<ProfileResponse|null>(null)
  const[comparison,setComparison]=useState<ComparisonResponse|null>(null)
  const[error,setError]=useState('')

  useEffect(()=>{Promise.all([getFields(),getObservations()]).then(([f,o])=>{setFields(f);setObs(o)}).catch(e=>setError(e.message))},[])

  useEffect(()=>{
    let alive=true
    setError('')
    setVolume(null);setSlice(null);setCurrents(null)
    if(view==='currents'){
      getCurrents().then(v=>alive&&setCurrents(v)).catch(e=>alive&&setError(e.message))
      return()=>{alive=false}
    }
    Promise.all([getTimes(field), view==='globe'||view==='slice' ? getSlice(field,depth,2,timeIndex) : getVolume(field,2,timeIndex)])
      .then(([ts,data])=>{
        if(!alive)return
        setTimes(ts)
        if(ts.length) setTimeIndex(i=>Math.min(i,ts.length-1))
        if(view==='globe'||view==='slice') setSlice(data as SliceResponse)
        else setVolume(data as VolumeResponse)
      })
      .catch(e=>alive&&setError(e.message))
    return()=>{alive=false}
  },[field,view,depth,timeIndex])

  const select=useCallback((m:ObservationMarker)=>{
    setSelected(m)
    Promise.all([getProfile(m.platform,m.cycle),getComparison(m.platform,m.cycle,field)])
      .then(([p,c])=>{setProfile(p);setComparison(c)})
      .catch(e=>setError(e.message))
  },[field])

  const changeField=(value:string)=>{setField(value);if(value==='currents')setView('currents')}
  const current=fields.find(f=>f.id===field)??null
  const isScalar=view!=='currents'

  return <main className="app">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">O</div><div><strong>OCEAN ANALYSIS CONSOLE</strong><small>SIH26067 · MVP</small></div></div>
      <div className="status"><span className="status-dot"/>SOURCE CONNECTED<span className="status-sep"/>INCOIS / ARGO</div>
    </header>

    <div className="workspace">
      <ControlPanel
        fields={fields.filter(f=>f.id!=='currents')}
        field={field}
        setField={changeField}
        view={view}
        setView={setView}
        depth={depth}
        setDepth={setDepth}
        opacity={opacity}
        setOpacity={setOpacity}
        exaggeration={exaggeration}
        setExaggeration={setExaggeration}
        times={times}
        timeIndex={timeIndex}
        setTimeIndex={setTimeIndex}
        observations={obs}
        selected={selected}
        onSelect={select}
        showObservations={showObs}
        setShowObservations={setShowObs}
      />

      <section className="viewport">
        <div className="viewport-title">
          <div><span className="eyebrow">{view==='globe'?'GLOBAL VIEW':view.replace('iso','ISOSURFACE').toUpperCase()}</span><h1>{view==='currents'?'Surface currents':current?.label??'Ocean field'}</h1><p>{view==='currents'?currents?.source??'Loading current field…':`${current?.source??'Loading field…'} · ${current?.units??''}${times[timeIndex]?` · ${times[timeIndex].slice(0,10)}`:''}`}</p></div>
          {isScalar&&<div className="legend"><span>{current?.color_min??'—'}</span><i/><span>{current?.color_max??'—'} {current?.units??''}</span></div>}
        </div>
        {error&&<div className="error">{error}</div>}
        <Suspense fallback={<div className="loading">Loading 3D view…</div>}>
          <OceanScene view={view} field={current} volume={volume} slice={slice} currents={currents} observations={showObs?obs:[]} selected={selected} opacity={opacity} exaggeration={exaggeration} onSelect={select}/>
        </Suspense>
        <DebugPanel field={current} slice={slice} volume={volume} currents={currents} view={view} depth={depth} timeIndex={timeIndex} time={times[timeIndex]} opacity={opacity} exaggeration={exaggeration}/>
        <div className="scene-hint">DRAG ROTATE · WHEEL ZOOM · DOUBLE-CLICK RESET</div>
      </section>
    </div>

    {selected&&<RightInspector selected={selected} profile={profile} comparison={comparison} field={current}/>} 
  </main>
}
