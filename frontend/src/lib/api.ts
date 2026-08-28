export type VolumeResponse = {
  variable: string
  shape: [number, number, number]
  values: number[]
  bounds: { min: number; max: number }
  missing_value: number
  depth: number[]
  latitude: number[]
  longitude: number[]
}

export type SliceResponse = {
  variable: string
  depth: number
  shape: [number, number]
  values: number[]
  latitude: number[]
  longitude: number[]
  missing_value: number
  bounds: { min: number; max: number }
}

export type ObservationMarker = {
  platform: string
  cycle: number
  sensor: string
  latitude: number
  longitude: number
  timestamp: string
  variables: string[]
}

export type ProfilePoint = { depth: number; observed: number | null; qc: string | null }
export type ProfileResponse = {
  platform: string
  cycle: number
  sensor: string
  timestamp: string
  latitude: number
  longitude: number
  variable: string
  units: string
  points: ProfilePoint[]
}

export type ComparisonPoint = { depth: number; observed: number | null; model: number | null; delta: number | null; qc: string | null }
export type ComparisonResponse = {
  platform: string
  cycle: number
  variable: string
  units: string
  observation_timestamp: string
  model_valid_time: string
  interpolation: string
  points: ComparisonPoint[]
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const getVolume = (lod = 2) => request<VolumeResponse>(`/api/fields/temperature/volume?lod=${lod}`)
export const getSlice = (depth: number, lod = 2) => request<SliceResponse>(`/api/fields/temperature/slice?depth=${depth}&lod=${lod}`)
export const getObservations = () => request<ObservationMarker[]>('/api/observations')
export const getProfile = (platform: string, cycle: number) => request<ProfileResponse>(`/api/observations/${platform}/${cycle}/profile`)
export const getComparison = (platform: string, cycle: number) => request<ComparisonResponse>(`/api/comparisons/profile?platform=${platform}&cycle=${cycle}&field_id=temperature`)
