import {useEffect,useRef} from 'react'
import * as THREE from 'three'
import Globe from 'globe.gl'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import type {FieldCatalogItem,ObservationMarker,SliceResponse,VectorFieldResponse,VolumeResponse} from '../lib/api'
import type {CubeMode,Region,View} from '../App'
import {paletteCss} from '../lib/volume'

type Props={view:View;cubeActive:boolean;cubeMode:CubeMode;isoValue:number|null;region:Region|null;selectRegion:boolean;field:FieldCatalogItem|null;volume:VolumeResponse|null;slice:SliceResponse|null;currents:VectorFieldResponse|null;observations:ObservationMarker[];selected:ObservationMarker|null;selectedBuoys:ObservationMarker[];opacity:number;exaggeration:number;onSelect:(m:ObservationMarker)=>void;onRegionPick:(lat:number,lon:number)=>void}
const R=100
const EARTH_TEXTURE='/earth/earth-blue-marble.jpg',EARTH_BUMP='/earth/earth-topology.png'
const neon='#d9ff00'
function geo(lat:number,lon:number,r=R){const p=THREE.MathUtils.degToRad(lat),l=THREE.MathUtils.degToRad(lon);return new THREE.Vector3(r*Math.cos(p)*Math.sin(l),r*Math.sin(p),r*Math.cos(p)*Math.cos(l))}
function basis(lat:number,lon:number){const p=THREE.MathUtils.degToRad(lat),l=THREE.MathUtils.degToRad(lon);return{east:new THREE.Vector3(Math.cos(l),0,-Math.sin(l)),north:new THREE.Vector3(-Math.sin(p)*Math.sin(l),Math.cos(p),-Math.sin(p)*Math.cos(l)),up:new THREE.Vector3(Math.cos(p)*Math.sin(l),Math.sin(p),Math.cos(p)*Math.cos(l))}}
function colorFor(value:number,min:number,max:number){return new THREE.Color(paletteCss(THREE.MathUtils.clamp((value-min)/(max-min||1),0,1)))}
function bilinear(values:number[],ny:number,nx:number,fy:number,fx:number){const y=Math.max(0,Math.min(ny-1,fy)),x=Math.max(0,Math.min(nx-1,fx)),y0=Math.floor(y),x0=Math.floor(x),y1=Math.min(ny-1,y0+1),x1=Math.min(nx-1,x0+1),a=y-y0,b=x-x0,q=(yy:number,xx:number)=>values[yy*nx+xx],v=[q(y0,x0),q(y0,x1),q(y1,x0),q(y1,x1)];if(v.some(n=>!Number.isFinite(n)||n===-9999))return NaN;return v[0]*(1-a)*(1-b)+v[1]*(1-a)*b+v[2]*a*(1-b)+v[3]*a*b}
function makeFieldTexture(slice:SliceResponse,size=1024){const[ny,nx]=slice.shape,canvas=document.createElement('canvas');canvas.width=size;canvas.height=Math.round(size*.5);const ctx=canvas.getContext('2d')!,img=ctx.createImageData(canvas.width,canvas.height),lat0=slice.latitude[0],lat1=slice.latitude.at(-1)!,lon0=slice.longitude[0],lon1=slice.longitude.at(-1)!;for(let py=0;py<img.height;py++){const lat=lat0+(lat1-lat0)*(py/(img.height-1)),fy=(lat-lat0)/(lat1-lat0||1)*(ny-1);for(let px=0;px<img.width;px++){const lon=lon0+(lon1-lon0)*(px/(img.width-1)),fx=(lon-lon0)/(lon1-lon0||1)*(nx-1),v=bilinear(slice.values,ny,nx,fy,fx),k=(py*img.width+px)*4;if(!Number.isFinite(v)){img.data[k+3]=0;continue}const c=colorFor(v,slice.bounds.min,slice.bounds.max);img.data[k]=c.r*255;img.data[k+1]=c.g*255;img.data[k+2]=c.b*255;img.data[k+3]=255}}ctx.putImageData(img,0,0);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearMipmapLinearFilter;tex.magFilter=THREE.LinearFilter;tex.anisotropy=8;return{tex,lat0,lat1,lon0,lon1}}
function fieldMaterial(slice:SliceResponse,opacity:number){const{tex,lat0,lat1,lon0,lon1}=makeFieldTexture(slice);return new THREE.ShaderMaterial({uniforms:{map:{value:tex},opacity:{value:opacity},lat0:{value:THREE.MathUtils.degToRad(lat0)},lat1:{value:THREE.MathUtils.degToRad(lat1)},lon0:{value:THREE.MathUtils.degToRad(lon0)},lon1:{value:THREE.MathUtils.degToRad(lon1)}},vertexShader:`varying vec3 vWorld;void main(){vec4 wp=modelMatrix*vec4(position,1.);vWorld=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`,fragmentShader:`uniform sampler2D map;uniform float opacity,lat0,lat1,lon0,lon1;varying vec3 vWorld;void main(){vec3 n=normalize(vWorld);float lat=asin(clamp(n.y,-1.,1.));float lon=atan(n.x,n.z);float u=(lon-lon0)/(lon1-lon0),v=(lat-lat0)/(lat1-lat0);if(u<0.||u>1.||v<0.||v>1.)discard;vec4 c=texture2D(map,vec2(u,1.-v));if(c.a<.01)discard;gl_FragColor=vec4(c.rgb,c.a*opacity);}`,transparent:true,depthWrite:false,side:THREE.FrontSide})}
function makeSurface(slice:SliceResponse,opacity:number){const mesh=new THREE.Mesh(new THREE.SphereGeometry(R*1.006,192,96),fieldMaterial(slice,opacity));mesh.renderOrder=10;return mesh}
function makeDepthShell(slice:SliceResponse,opacity:number,depth:number){const radius=R-(THREE.MathUtils.clamp(depth,0,5000)/5000)*30;const mesh=new THREE.Mesh(new THREE.SphereGeometry(Math.max(64,radius),192,96),fieldMaterial(slice,opacity));mesh.renderOrder=20;return mesh}
function makeStreamlines(v:VectorFieldResponse){const paths:{points:number[][]}[]=[];const latMin=v.latitude[0],latMax=v.latitude.at(-1)!,lonMin=v.longitude[0],lonMax=v.longitude.at(-1)!,sy=24,sx=42,integrate=(lat:number,lon:number,sign:number)=>{const pts:number[][]=[];let la=lat,lo=lon;for(let i=0;i<56;i++){const f=bilinearVector(v,la,lo);if(!f)break;pts.push([la,lo]);const speed=Math.hypot(f.u,f.v);if(speed<.003)break;la+=f.v*.11*sign;lo+=f.u*.11*sign/Math.max(.25,Math.cos(THREE.MathUtils.degToRad(la)));if(la<latMin||la>latMax||lo<lonMin||lo>lonMax)break}return pts};for(let y=0;y<sy;y++)for(let x=0;x<sx;x++){const la=latMin+(latMax-latMin)*y/(sy-1),lo=lonMin+(lonMax-lonMin)*x/(sx-1),back=integrate(la,lo,-1).reverse(),forward=integrate(la,lo,1),points=back.concat(forward.slice(1));if(points.length>3)paths.push({points})}return paths}
function bilinearVector(v:VectorFieldResponse,lat:number,lon:number){const ny=v.latitude.length,nx=v.longitude.length,fy=(lat-v.latitude[0])/(v.latitude.at(-1)!-v.latitude[0]||1)*(ny-1),fx=(lon-v.longitude[0])/(v.longitude.at(-1)!-v.longitude[0]||1)*(nx-1);if(fx<0||fy<0||fx>nx-1||fy>ny-1)return null;const y0=Math.floor(fy),x0=Math.floor(fx),y1=Math.min(ny-1,y0+1),x1=Math.min(nx-1,x0+1),a=fy-y0,b=fx-x0,q=(arr:number[],y:number,x:number)=>arr[y*nx+x],u=q(v.u,y0,x0)*(1-a)*(1-b)+q(v.u,y0,x1)*(1-a)*b+q(v.u,y1,x0)*a*(1-b)+q(v.u,y1,x1)*a*b,w=q(v.v,y0,x0)*(1-a)*(1-b)+q(v.v,y0,x1)*(1-a)*b+q(v.v,y1,x0)*a*(1-b)+q(v.v,y1,x1)*a*b;return Number.isFinite(u)&&Number.isFinite(w)?{u,v:w}:null}

function disposeObject(o:THREE.Object3D){o.traverse((x:any)=>{x.geometry?.dispose?.();const m=x.material;if(Array.isArray(m))m.forEach((mm:any)=>{mm.map?.dispose?.();mm.dispose?.()});else{m?.map?.dispose?.();m?.dispose?.()}})}
function cubeColor(v:number,min:number,max:number){return colorFor(v,min,max)}
function cubePoint(lat:number,lon:number,depth:number,region:Region,w:number,h:number,d:number){const x=((lon-region.lonMin)/(region.lonMax-region.lonMin||1)-.5)*w;const z=(.5-(lat-region.latMin)/(region.latMax-region.latMin||1))*d;const y=h/2-(depth/Math.max(1,depth))*0;return new THREE.Vector3(x,y,z)}
function makeCubeFrame(region:Region,w:number,h:number,d:number){const group=new THREE.Group();const mat=new THREE.LineBasicMaterial({color:0x697176,transparent:true,opacity:.7});const pts=[new THREE.Vector3(-w/2,h/2,-d/2),new THREE.Vector3(w/2,h/2,-d/2),new THREE.Vector3(w/2,h/2,d/2),new THREE.Vector3(-w/2,h/2,d/2),new THREE.Vector3(-w/2,-h/2,-d/2),new THREE.Vector3(w/2,-h/2,-d/2),new THREE.Vector3(w/2,-h/2,d/2),new THREE.Vector3(-w/2,-h/2,d/2)];const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];for(const [a,b] of edges){const g=new THREE.BufferGeometry().setFromPoints([pts[a],pts[b]]);group.add(new THREE.Line(g,mat))}group.userData.region=region;return group}
function makeDepthTicks(depths:number[],h:number){const group=new THREE.Group(),max=depths.at(-1)??1,mat=new THREE.LineBasicMaterial({color:0x6e777b,transparent:true,opacity:.65});for(const dep of depths){const y=h/2-(dep/max)*h;const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.18,y,0),new THREE.Vector3(.18,y,0)]);group.add(new THREE.Line(g,mat))}return group}
function labelSprite(text:string){const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d')!;x.clearRect(0,0,c.width,c.height);x.fillStyle='#c8d0d3';x.font='28px monospace';x.fillText(text,4,38);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false});const s=new THREE.Sprite(m);s.scale.set(3.2,.4,1);return s}
function makeVolumePlanes(v:VolumeResponse,w:number,h:number,d:number,opacity:number){
 const[nz,ny,nx]=v.shape,group=new THREE.Group(),maxDepth=v.depth.at(-1)??1;
 for(let z=0;z<nz;z++){
  const geom=new THREE.BufferGeometry(),positions:number[]=[],colors:number[]=[];
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
   const px=(x/Math.max(1,nx-1)-.5)*w,pz=(.5-y/Math.max(1,ny-1))*d,py=h/2-(v.depth[z]/maxDepth)*h;
   positions.push(px,py,pz);
   const value=v.values[z*ny*nx+y*nx+x];
   const c=Number.isFinite(value)&&value!==v.missing_value?cubeColor(value,v.bounds.min,v.bounds.max):new THREE.Color(0,0,0);
   colors.push(c.r,c.g,c.b);
  }
  const indices:number[]=[];
  for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){const i=y*nx+x;indices.push(i,i+1,i+nx,i+1,i+nx+1,i+nx)}
  geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geom.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geom.setIndex(indices);
  const mesh=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:opacity*.28,side:THREE.DoubleSide,depthWrite:false,depthTest:true}));
  mesh.renderOrder=10+z;
  group.add(mesh);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geom,35),new THREE.LineBasicMaterial({color:0x9ca7ab,transparent:true,opacity:.28,depthTest:false}));
  edge.renderOrder=80+z;
  group.add(edge);
 }
 return group;
}
function makeIsoPoints(v:VolumeResponse,iso:number|null,w:number,h:number,d:number){
 if(iso===null)return null;
 const[nz,ny,nx]=v.shape,maxDepth=v.depth.at(-1)??1,pos:number[]=[],minDistance=Math.max((v.bounds.max-v.bounds.min)/24,.01);
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const value=v.values[z*ny*nx+y*nx+x];
  if(!Number.isFinite(value)||value===v.missing_value||Math.abs(value-iso)>minDistance)continue;
  pos.push((x/Math.max(1,nx-1)-.5)*w,h/2-(v.depth[z]/maxDepth)*h,(.5-y/Math.max(1,ny-1))*d);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 const group=new THREE.Group();
 const halo=new THREE.Points(g.clone(),new THREE.PointsMaterial({color:0xffffff,size:.16,sizeAttenuation:true,transparent:true,opacity:.95,depthTest:false}));
 const inner=new THREE.Points(g,new THREE.PointsMaterial({color:colorFor(iso,v.bounds.min,v.bounds.max),size:.105,sizeAttenuation:true,transparent:true,opacity:1,depthTest:false}));
 halo.renderOrder=120;inner.renderOrder=121;group.add(halo,inner);
 return group;
}
function makeCubeCurrents(v:VectorFieldResponse,w:number,h:number,d:number,region:Region){const group=new THREE.Group(),z=h/2+.06,lat0=region.latMin,lat1=region.latMax,lon0=region.lonMin,lon1=region.lonMax;const lines=makeStreamlines(v);for(const path of lines){const pts=path.points.map(([lat,lon])=>new THREE.Vector3(((lon-lon0)/(lon1-lon0||1)-.5)*w,z,(.5-(lat-lat0)/(lat1-lat0||1))*d));if(pts.length<2)continue;const g=new THREE.BufferGeometry().setFromPoints(pts);group.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xf5f7f7,transparent:true,opacity:.78})));}return group}


export function OceanScene(p:Props){
 const ref=useRef<HTMLDivElement>(null),globeRef=useRef<any>(null),cubeRef=useRef<{renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;controls:OrbitControls;objects:THREE.Object3D[];buoys:THREE.Group|null;resize:()=>void;cleanup:()=>void}|null>(null),cubeCameraStateRef=useRef<{position:[number,number,number];target:[number,number,number]}|null>(null),selectRef=useRef(p.onSelect),regionRef=useRef(p.onRegionPick),selectModeRef=useRef(p.selectRegion)
 selectRef.current=p.onSelect;regionRef.current=p.onRegionPick;selectModeRef.current=p.selectRegion
 useEffect(()=>{if(!ref.current||p.cubeActive)return;const host=ref.current,g=new Globe(host,{animateIn:false,waitForGlobeReady:true}).backgroundColor('#000000').globeImageUrl(EARTH_TEXTURE).bumpImageUrl(EARTH_BUMP).showAtmosphere(true).atmosphereColor('#8ddff0').atmosphereAltitude(.045).showGraticules(true).pointOfView({lat:18,lng:78,altitude:1.8});const renderer=g.renderer();renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;g.controls().enableDamping=true;g.controls().dampingFactor=.08;g.controls().minDistance=118;g.controls().maxDistance=500;gRefSetup(g,host);globeRef.current=g;return()=>{g._destructor();globeRef.current=null}},[])
 useEffect(()=>{const g=globeRef.current;if(!g||p.cubeActive)return;g.pointsData(p.observations).pointLat('latitude').pointLng('longitude').pointColor((d:any)=>p.selectedBuoys.some(s=>s.platform===d.platform&&s.cycle===d.cycle)||p.selected?.platform===d.platform?neon:'#f3f6f7').pointAltitude(.02).pointRadius((d:any)=>p.selectedBuoys.some(s=>s.platform===d.platform&&s.cycle===d.cycle)||p.selected?.platform===d.platform?.85:.5).pointResolution(12).pointLabel((d:any)=>`${d.platform} · cycle ${d.cycle}`).onPointClick((d:any)=>selectModeRef.current?selectRef.current(d):selectRef.current(d)).onGlobeClick((lat:number,lng:number)=>{if(selectModeRef.current)regionRef.current(lat,lng)})},[p.observations,p.selected,p.selectedBuoys])
 useEffect(()=>{const g=globeRef.current;if(!g||p.cubeActive)return;const analytical=p.view==='slice';const gm=g.globeMaterial() as any;gm.transparent=analytical;gm.opacity=analytical?.12:1;gm.depthWrite=!analytical;gm.needsUpdate=true;g.customLayerData([]);if(p.slice&&p.view==='globe')g.customLayerData([makeSurface(p.slice,p.opacity)]).customThreeObject((d:any)=>d);if(p.slice&&p.view==='slice')g.customLayerData([makeDepthShell(p.slice,p.opacity,p.slice.depth)]).customThreeObject((d:any)=>d);if(p.view==='currents'&&p.currents){const paths=makeStreamlines(p.currents);g.pathsData(paths).pathPoints('points').pathPointLat((q:any)=>q[0]).pathPointLng((q:any)=>q[1]).pathColor(()=>`rgba(255,255,255,.86)`).pathStroke(1.1).pathDashLength(.5).pathDashGap(.22).pathDashAnimateTime(1400)}else g.pathsData([])},[p.view,p.slice,p.currents,p.opacity])
 useEffect(()=>{
  if(!ref.current||!p.cubeActive||!p.region||!p.volume)return;
  const host=ref.current,previous=cubeRef.current;
  if(previous){
   previous.cleanup();
   cubeRef.current=null;
  }
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:false});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio));
  renderer.setSize(host.clientWidth,host.clientHeight);
  renderer.setClearColor(0x000000,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  host.replaceChildren(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,host.clientWidth/Math.max(1,host.clientHeight),.01,1000);
  camera.position.set(8,7,11);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  controls.dampingFactor=.075;
  controls.minDistance=7;
  controls.maxDistance=28;
  controls.target.set(0,0,0);
  const saved=cubeCameraStateRef.current;
  if(saved){camera.position.set(...saved.position);controls.target.set(...saved.target);controls.update()}
  const objects:THREE.Object3D[]=[];
  const v=p.volume,w=10,h=6.5,d=10*Math.min(1.35,Math.max(.7,(p.region.latMax-p.region.latMin)/(p.region.lonMax-p.region.lonMin||1)*1.3));
  const frame=makeCubeFrame(p.region,w,h,d);scene.add(frame);objects.push(frame);
  const grid=new THREE.GridHelper(Math.max(w,d)*1.35,18,0x596166,0x252a2d);grid.position.y=-h/2-.01;scene.add(grid);objects.push(grid);
  const planes=makeVolumePlanes(v,w,h,d,.72);scene.add(planes);objects.push(planes);
  if(p.cubeMode==='currents'&&p.currents){const cg=makeCubeCurrents(p.currents,w,h,d,p.region);scene.add(cg);objects.push(cg)}
  const top=labelSprite(`LAT ${p.region.latMin.toFixed(1)}°–${p.region.latMax.toFixed(1)}°`);top.position.set(-w/2,h/2+.35,-d/2);scene.add(top);objects.push(top);
  const side=labelSprite(`LON ${p.region.lonMin.toFixed(1)}°–${p.region.lonMax.toFixed(1)}°`);side.position.set(w/2+.5,h/2+.35,d/2);scene.add(side);objects.push(side);
  const dep=labelSprite(`DEPTH 0 → ${(v.depth.at(-1)??0).toFixed(0)} m`);dep.position.set(-w/2-.9,0,d/2);dep.scale.set(2.8,.35,1);scene.add(dep);objects.push(dep);
  const depthTicks=makeDepthTicks(v.depth,h);depthTicks.position.x=-w/2-.35;scene.add(depthTicks);objects.push(depthTicks);
  for(const depValue of v.depth.filter((_,i)=>i===0||i===v.depth.length-1||i%Math.max(1,Math.floor(v.depth.length/6))===0)){const label=labelSprite(`${depValue.toFixed(0)} m`);label.scale.set(1.45,.25,1);label.position.set(-w/2-1.15,h/2-(depValue/(v.depth.at(-1)??1))*h,-d/2);scene.add(label);objects.push(label)}
  const light=new THREE.AmbientLight(0xffffff,.7);scene.add(light);
  const ro=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix()});ro.observe(host);
  let raf=0;const animate=()=>{raf=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)};animate();
  const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix()};
  const cleanup=()=>{cubeCameraStateRef.current={position:[camera.position.x,camera.position.y,camera.position.z],target:[controls.target.x,controls.target.y,controls.target.z]};cancelAnimationFrame(raf);ro.disconnect();controls.dispose();objects.forEach(disposeObject);renderer.dispose();if(cubeRef.current?.camera===camera)cubeRef.current=null};
  cubeRef.current={renderer,scene,camera,controls,objects,buoys:null,resize,cleanup};
  return cleanup;
 },[p.cubeActive,p.region,p.volume,p.cubeMode,p.currents]);

 useEffect(()=>{
  if(!p.cubeActive||!cubeRef.current||!cubeRef.current.scene||!p.volume)return;
  const scene=cubeRef.current.scene;
  const previous=scene.getObjectByName('isovalue-highlight');
  if(previous){scene.remove(previous);disposeObject(previous)}
  const width=10,height=6.5,latSpan=(p.region?.latMax??1)-(p.region?.latMin??0),lonSpan=(p.region?.lonMax??1)-(p.region?.lonMin??0),depth=10*Math.min(1.35,Math.max(.7,latSpan/(lonSpan||1)*1.3));
  if(p.cubeMode!=='volume')return;
  const iso=makeIsoPoints(p.volume,p.isoValue,width,height,depth);
  if(iso){iso.name='isovalue-highlight';scene.add(iso)}
 },[p.isoValue,p.cubeActive,p.volume,p.region]);

 useEffect(()=>{if(!p.cubeActive&&p.selectRegion&&ref.current){let box=ref.current.querySelector('.roi-cursor') as HTMLDivElement|null;if(!box){box=document.createElement('div');box.className='roi-cursor';box.textContent='ROI';ref.current.appendChild(box)}const move=(e:MouseEvent)=>{const r=ref.current!.getBoundingClientRect();box!.style.left=`${e.clientX-r.left-42}px`;box!.style.top=`${e.clientY-r.top-28}px`};ref.current.addEventListener('mousemove',move);return()=>ref.current?.removeEventListener('mousemove',move)}},[p.cubeActive,p.selectRegion])
 return <div ref={ref} className={`ocean-scene ${p.cubeActive?'cube-scene':''}`} aria-label={p.cubeActive?'Interactive regional ocean data cube':'Interactive geographic ocean analysis globe'}/>
}
function gRefSetup(g:any,host:HTMLDivElement){const resize=()=>{g.width(host.clientWidth);g.height(host.clientHeight)};const ro=new ResizeObserver(resize);ro.observe(host);resize();const gm=g.globeMaterial() as any;for(const map of [gm.map,gm.bumpMap])if(map){map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=Math.min(16,g.renderer().capabilities.getMaxAnisotropy());map.needsUpdate=true}}
