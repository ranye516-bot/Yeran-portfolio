import React, { useEffect, useRef } from 'react'
import './Grainient.css'

const palette = ['#080b0b', '#101917', '#182622', '#263832', '#374b45']
const settings = { angle: 128, flow: 0.74, scale: 1.38, speed: 0.17, silk: 0.16, grainAmount: 0.032 }

const vertex = `#version 300 es
out vec2 uv;
void main() {
  uv = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`

const fragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 pixel;
uniform vec3 ramp[5];
uniform vec2 direction;
uniform vec2 pointer;
uniform float aspect, time, flow, scale, silk, grainAmount;

vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return 0.5 + 0.5 * mix(
    mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), w.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + 1.0), f - 1.0), w.x),
    w.y
  );
}

vec2 drift(vec2 p) {
  vec2 coarse = vec2(noise(p + vec2(time * 0.11, 1.8)), noise(p - vec2(2.6, time * 0.09)));
  vec2 fine = vec2(noise(p * 1.7 + coarse * 1.6 + time * 0.07), noise(p * 1.7 - coarse * 1.3 + 4.2));
  return (coarse - 0.5) * 1.15 + (fine - 0.5) * 0.5;
}

void main() {
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 offset = (pointer - 0.5) * vec2(0.45, 0.35);
  vec2 warp = p + drift(p / scale + offset + vec2(6.2, 1.1)) * flow;
  float range = dot(abs(direction), vec2(aspect, 1.0));
  float diagonal = dot(warp + offset, direction) / range;
  float ribbon = 0.52 + diagonal * 0.77 + sin(warp.y * 3.6 + warp.x * 1.5) * 0.13;
  float band = clamp(ribbon, 0.0, 1.0) * 4.0;
  int low = min(int(floor(band)), 3);
  vec3 color = mix(ramp[low], ramp[low + 1], smoothstep(0.0, 1.0, band - float(low)));
  color *= 1.0 + silk * sin(ribbon * 10.0 + noise(warp * 1.8) * 1.1) * 0.32;
  float grit = hash2(gl_FragCoord.xy).x + hash2(gl_FragCoord.xy + 7.13).y;
  pixel = vec4(color + grit * grainAmount * 0.26, 1.0);
}`

function makeRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' })
  if (!gl) return null
  const program = gl.createProgram()
  if (!program) return null
  for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(kind)
    if (!shader) {
      gl.deleteProgram(program)
      return null
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      gl.deleteProgram(program)
      return null
    }
    gl.attachShader(program, shader)
    gl.deleteShader(shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  gl.useProgram(program)
  const uniform = (name) => gl.getUniformLocation(program, name)
  const channels = palette.flatMap((hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255))
  gl.uniform3fv(uniform('ramp[0]'), channels)
  const angle = settings.angle * Math.PI / 180
  gl.uniform2f(uniform('direction'), Math.sin(angle), Math.cos(angle))
  for (const name of ['flow', 'scale', 'silk', 'grainAmount']) gl.uniform1f(uniform(name), settings[name])
  const time = uniform('time')
  const aspect = uniform('aspect')
  const pointer = uniform('pointer')

  return {
    resize() {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(aspect, canvas.width / canvas.height)
    },
    draw(elapsed, x, y) {
      gl.uniform1f(time, elapsed)
      gl.uniform2f(pointer, x, y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() { gl.deleteProgram(program) },
  }
}

export default function Grainient() {
  const surface = useRef(null)
  const canvas = useRef(null)

  useEffect(() => {
    const container = surface.current
    const layer = canvas.current
    const hero = document.querySelector('.hero')
    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let renderer
    let timer = 0
    let previous = 0
    let elapsed = 0
    let x = 0.5
    let y = 0.5
    let targetX = x
    let targetY = y
    let behindHero = true
    let attempted = false

    function resize() {
      if (!renderer) return
      const width = container.clientWidth
      const height = container.clientHeight
      const ratio = Math.min(0.55, 768 / width, 512 / height)
      const canvasWidth = Math.max(1, Math.round(width * ratio))
      const canvasHeight = Math.max(1, Math.round(height * ratio))
      if (layer.width !== canvasWidth) layer.width = canvasWidth
      if (layer.height !== canvasHeight) layer.height = canvasHeight
      renderer.resize()
      if (!behindHero && !document.hidden && preference.matches) renderer.draw(elapsed, x, y)
    }

    function animate() {
      const now = performance.now()
      if (!previous) previous = now
      const delta = Math.min(80, now - previous)
      previous = now
      elapsed += delta * 0.001 * settings.speed
      const easing = 1 - Math.exp(-delta / 390)
      x += (targetX - x) * easing
      y += (targetY - y) * easing
      renderer.draw(elapsed, x, y)
      timer = window.setTimeout(animate, 50)
    }

    function syncMotion() {
      window.clearTimeout(timer)
      previous = 0
      const enabled = preference.matches && !document.hidden && !behindHero
      if (!enabled) {
        if (!preference.matches) container.dataset.rendered = 'false'
        return
      }
      if (!attempted) {
        attempted = true
        renderer = makeRenderer(layer)
        resize()
      }
      container.dataset.rendered = Boolean(renderer)
      if (renderer) timer = window.setTimeout(animate, 50)
    }

    function contextLost(event) {
      event.preventDefault()
      window.clearTimeout(timer)
      renderer = null
      container.dataset.rendered = 'false'
    }

    function contextRestored() {
      attempted = false
      syncMotion()
    }

    function aim(event) {
      if (!renderer || behindHero || document.hidden || !preference.matches || event.pointerType !== 'mouse') return
      const reacts = event.target.closest('#about, #contact')
      targetX = reacts ? event.clientX / window.innerWidth : 0.5
      targetY = reacts ? 1 - event.clientY / window.innerHeight : 0.5
    }

    const observer = new ResizeObserver(resize)
    const heroView = new IntersectionObserver(([entry]) => {
      behindHero = entry.intersectionRatio > 0.92
      syncMotion()
    }, { threshold: [0.92] })
    observer.observe(container)
    heroView.observe(hero)
    window.addEventListener('pointermove', aim, { passive: true })
    document.addEventListener('visibilitychange', syncMotion)
    preference.addEventListener('change', syncMotion)
    layer.addEventListener('webglcontextlost', contextLost)
    layer.addEventListener('webglcontextrestored', contextRestored)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      heroView.disconnect()
      window.removeEventListener('pointermove', aim)
      document.removeEventListener('visibilitychange', syncMotion)
      preference.removeEventListener('change', syncMotion)
      layer.removeEventListener('webglcontextlost', contextLost)
      layer.removeEventListener('webglcontextrestored', contextRestored)
      renderer?.dispose()
    }
  }, [])

  return <div className="grainient" ref={surface} aria-hidden="true"><canvas ref={canvas} /></div>
}
