export type FieldCatalogItem={id:string;label:string;short:string;units:string;source:string;kind:string;color_min:number;color_max:number}
export type VolumeResponse={variable:string;units:string;shape:[number,number,number];values:number[];bounds:{min:number;max:number};missing_value:number;depth:number[];latitude:number[];longitude:number[];source:string;valid_time:string}
export type SliceResponse={variable:string;units:string;depth:number;shape:[number,number];values:number[];latitude:number[];longitude:number[];missing_value:number;bounds:{min:number;max:number}}
export type ObservationMarker={platform:string;cycle:number;sensor:string;latitude:number;longitude:number;timestamp:string;variables:string[]}
export type ProfilePoint={depth:number;observed:number|null;salinity:number|null;qc:string|null}
export type ProfileResponse={platform:string;cycle:number;sensor:string;timestamp:string;latitude:number;longitude:number;variable:string;units:string;points:ProfilePoint[]}
export type ComparisonPoint={depth:number;observed:number|null;model:number|null;delta:number|null;qc:string|null}
export type ComparisonResponse={platform:string;cycle:number;variable:string;units:string;observation_timestamp:string;model_valid_time:string;interpolation:string;points:ComparisonPoint[]}
const API_BASE=(import.meta.env.VITE_API_BASE_URL??'').replace(/\/$/,'')
async function request<T>(path:string):Promise<T>{const r=await fetch(`${API_BASE}${path}`);if(!r.ok){const b=await r.json().catch(()=>({}));throw new Error(b?.error?.message??`Request failed: ${r.status}`)}return r.json()}
export const getFields=()=>request<FieldCatalogItem[]>('/api/fields')
export const getVolume=(field:string,lod=1)=>request<VolumeResponse>(`/api/fields/${field}/volume?lod=${lod}`)
export const getSlice=(field:string,depth:number,lod=1)=>request<SliceResponse>(`/api/fields/${field}/slice?depth=${depth}&lod=${lod}`)
export const getObservations=()=>request<ObservationMarker[]>('/api/observations')
export const getProfile=(platform:string,cycle:number)=>request<ProfileResponse>(`/api/observations/${platform}/${cycle}/profile`)
export const getComparison=(platform:string,cycle:number,field='salinity')=>request<ComparisonResponse>(`/api/comparisons/profile?platform=${platform}&cycle=${cycle}&field_id=${field}`)
export type VectorFieldResponse={variable:string;units:string;shape:[number,number];u:number[];v:number[];latitude:number[];longitude:number[];source:string;valid_time:string}
export const getCurrents=()=>request<VectorFieldResponse>('/api/fields/currents/vector')
