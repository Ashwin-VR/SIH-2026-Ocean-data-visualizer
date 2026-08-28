import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ObservationMarker, SliceResponse, VolumeResponse } from '../lib/api'
import { normalizeScalarRange } from '../lib/volume'

type Props = {
  volume: VolumeResponse | null
  slice: SliceResponse | null
  mode: 'volume' | 'slice'
  opacity: number
  verticalExaggeration: number
  selected: ObservationMarker | null
  onSelect: (marker: ObservationMarker) => void
  observations: ObservationMarker[]
}

const vertexShader = `
varying vec3 vPosition;
void main() {
  vPosition = position * 0.5 + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler3D uVolume;
uniform vec3 uCamera;
uniform vec3 uSize;
uniform float uOpacity;
uniform float uSteps;
varying vec3 vPosition;

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.02, 0.18, 0.35);
  vec3 c1 = vec3(0.02, 0.55, 0.72);
  vec3 c2 = vec3(0.92, 0.72, 0.24);
  vec3 c3 = vec3(0.94, 0.23, 0.12);
  if (t < 0.33) return mix(c0, c1, t / 0.33);
  if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
  return mix(c2, c3, (t - 0.66) / 0.34);
}

void main() {
  vec3 rayDir = normalize(uCamera - vPosition);
  float stepSize = 1.0 / uSteps;
  vec3 pos = vPosition;
  vec4 accum = vec4(0.0);
  for (float i = 0.0; i < 256.0; i += 1.0) {
    if (i >= uSteps || any(lessThan(pos, vec3(0.0))) || any(greaterThan(pos, vec3(1.0)))) break;
    float scalar = texture(uVolume, pos).r;
    float density = smoothstep(0.08, 0.78, scalar) * uOpacity;
    vec3 color = palette(scalar);
    float alpha = density * 0.055;
    accum.rgb += (1.0 - accum.a) * color * alpha;
    accum.a += (1.0 - accum.a) * alpha;
    if (accum.a > 0.96) break;
    pos += rayDir * stepSize;
  }
  if (accum.a < 0.015) discard;
  gl_FragColor = accum;
}
`

function buildVolumeTexture(volume: VolumeResponse) {
  const [nz, ny, nx] = volume.shape
  const data = normalizeScalarRange(volume.values, volume.bounds.min, volume.bounds.max, 'linear', volume.missing_value)
  const texture = new THREE.Data3DTexture(data, nx, ny, nz)
  texture.format = THREE.RedFormat
  texture.type = THREE.FloatType
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}

function addMarkers(scene: THREE.Object3D, markers: ObservationMarker[], selected: ObservationMarker | null, onSelect: (marker: ObservationMarker) => void) {
  const group = new THREE.Group()
  markers.forEach((marker) => {
    const geometry = new THREE.SphereGeometry(selected?.platform === marker.platform ? 0.045 : 0.028, 12, 8)
    const material = new THREE.MeshBasicMaterial({ color: selected?.platform === marker.platform ? 0xffc857 : 0x72d6ff })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set((marker.longitude - 75) / 30, 0.5, -(marker.latitude - 8) / 18)
    mesh.userData.marker = marker
    mesh.userData.onSelect = onSelect
    group.add(mesh)
  })
  scene.add(group)
  return group
}

export function OceanScene({ volume, slice, mode, opacity, verticalExaggeration, selected, onSelect, observations }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; controls: OrbitControls; root: THREE.Group } | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const host = hostRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#061019')
    const camera = new THREE.PerspectiveCamera(45, host.clientWidth / Math.max(1, host.clientHeight), 0.01, 100)
    camera.position.set(2.2, 1.5, 2.4)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 1.4
    controls.maxDistance = 6
    const root = new THREE.Group()
    scene.add(root)
    stateRef.current = { scene, camera, renderer, controls, root }

    const onResize = () => {
      camera.aspect = host.clientWidth / Math.max(1, host.clientHeight)
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    const observer = new ResizeObserver(onResize)
    observer.observe(host)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(root.children, true)
      const marker = hits.find((hit) => hit.object.userData.marker)?.object.userData.marker as ObservationMarker | undefined
      if (marker) onSelect(marker)
    }
    renderer.domElement.addEventListener('pointerup', onPointer)
    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      controls.update()
      root.traverse((object) => {
        const material = (object as THREE.Mesh).material
        if (material && !Array.isArray(material) && material instanceof THREE.ShaderMaterial && material.uniforms.uCamera) {
          const height = Math.max(0.1, 1.4 * verticalExaggeration)
          material.uniforms.uCamera.value.set(camera.position.x / 2 + 0.5, camera.position.y / height + 0.5, camera.position.z / 2 + 0.5)
        }
      })
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerup', onPointer)
      controls.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
      stateRef.current = null
    }
  }, [onSelect])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const { root } = state
    while (root.children.length) root.remove(root.children[0])

    const markerGroup = addMarkers(root, observations, selected, onSelect)
    markerGroup.position.y = 0

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 1.4 * verticalExaggeration, 2)),
      new THREE.LineBasicMaterial({ color: 0x31505f, transparent: true, opacity: 0.75 }),
    )
    outline.position.y = 0
    root.add(outline)

    if (mode === 'volume' && volume) {
      const texture = buildVolumeTexture(volume)
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uVolume: { value: texture },
          uCamera: { value: new THREE.Vector3(1.1, 1.0, 1.2) },
          uSize: { value: new THREE.Vector3(volume.shape[2], volume.shape[1], volume.shape[0]) },
          uOpacity: { value: opacity },
          uSteps: { value: Math.min(180, Math.max(48, volume.shape[0] * 10)) },
        },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4 * verticalExaggeration, 2), material)
      root.add(mesh)
      return () => { texture.dispose(); material.dispose(); mesh.geometry.dispose() }
    }

    if (slice) {
      const geometry = new THREE.PlaneGeometry(2, 2, Math.max(1, slice.shape[1] - 1), Math.max(1, slice.shape[0] - 1))
      geometry.rotateX(-Math.PI / 2)
      const colors = normalizeScalarRange(slice.values, slice.bounds.min, slice.bounds.max, 'linear', slice.missing_value)
      const colorAttr = new Float32Array(colors.length * 3)
      for (let i = 0; i < colors.length; i += 1) {
        const t = colors[i]
        colorAttr[i * 3] = 0.02 + 0.9 * Math.max(0, t - 0.35)
        colorAttr[i * 3 + 1] = 0.18 + 0.7 * Math.min(1, t * 1.5)
        colorAttr[i * 3 + 2] = 0.5 + 0.45 * (1 - t)
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorAttr, 3))
      const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity })
      const plane = new THREE.Mesh(geometry, material)
      plane.scale.set(1, 1, verticalExaggeration)
      plane.position.y = 0.6 - (slice.depth / 1000) * 1.2 * verticalExaggeration
      root.add(plane)
      return () => { geometry.dispose(); material.dispose() }
    }
  }, [mode, volume, slice, opacity, verticalExaggeration, observations, selected, onSelect])

  return <div ref={hostRef} className="ocean-scene" aria-label="Interactive 3D ocean field" />
}
