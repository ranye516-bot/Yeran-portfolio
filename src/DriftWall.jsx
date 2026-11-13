import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './DriftWall.css'

const modulo = (value, period) => ((value % period) + period) % period

export default function DriftWall({ items, onOpen, suspended, filtered }) {
  const wall = useRef(null)
  const tracks = useRef([])
  const offsets = useRef([])
  const keyboardTiles = useRef(new Map())
  const hovered = useRef(-1)
  const focused = useRef(null)
  const [size, setSize] = useState({ width: 1000, height: 600 })
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const [preview, setPreview] = useState(null)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const staticWall = reduced || filtered
  const columns = size.width >= 980 ? 5 : size.width >= 630 ? 4 : 3
  const gap = size.width >= 630 ? 16 : 9
  const tileWidth = Math.round(size.width * 1.08 / columns)
  const tileHeight = Math.round(tileWidth * 0.67)
  const row = tileHeight + gap

  const groups = useMemo(() => {
    const result = Array.from({ length: Math.min(columns, items.length) }, () => [])
    items.forEach((item, index) => result[index % result.length].push(item))
    return result
  }, [items, columns])

  useLayoutEffect(() => {
    const stage = wall.current
    const resize = new ResizeObserver(([entry]) => setSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    }))
    const view = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    resize.observe(stage)
    view.observe(stage)
    return () => { resize.disconnect(); view.disconnect() }
  }, [])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  function placeColumn(index) {
    const amount = focused.current?.index === index ? focused.current.shift : offsets.current[index]
    if (tracks.current[index]) tracks.current[index].style.transform = `translate3d(0, ${-amount}px, 0)`
  }

  useLayoutEffect(() => {
    focused.current = null
    offsets.current = groups.map((group, index) => group.length * row * ((0.15 + index * 0.29) % 1))
    groups.forEach((_, index) => placeColumn(index))
  }, [groups, row, staticWall])

  useEffect(() => {
    if (!visible || suspended || paused || staticWall) return
    let previous
    let frame
    function animate(now) {
      frame = requestAnimationFrame(animate)
      if (previous !== undefined && now - previous < 31) return
      const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05)
      previous = now
      groups.forEach((group, index) => {
        if (hovered.current === index || focused.current?.index === index) return
        const speed = (19 + (index * 7 % 12)) * (index % 2 === 0 ? 1 : -1)
        offsets.current[index] = modulo(offsets.current[index] + speed * dt, group.length * row)
        placeColumn(index)
      })
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [groups, paused, row, staticWall, suspended, visible])

  function renderTile(item, index, copy) {
    return (
      <button
        key={item.id} type="button" className="drift-wall__tile" data-portrait={item.portrait}
        tabIndex={copy ? -1 : undefined} aria-hidden={copy ? true : undefined} aria-label={`查看 ${item.title}`}
        ref={copy ? undefined : (node) => {
          if (node) keyboardTiles.current.set(item.id, node)
          else keyboardTiles.current.delete(item.id)
        }}
        onPointerDown={copy ? (event) => { if (event.pointerType === 'mouse') event.preventDefault() } : undefined}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPreview(item) }}
        onPointerLeave={(event) => { if (event.pointerType === 'mouse') setPreview(null) }}
        onFocus={(event) => {
          if (!event.currentTarget.matches(':focus-visible')) return
          setPreview(item)
          if (staticWall) return
          focused.current = { index, shift: event.currentTarget.offsetTop - size.height * 0.41 }
          placeColumn(index)
        }}
        onBlur={() => {
          setPreview(null)
          if (focused.current?.index !== index) return
          focused.current = null
          placeColumn(index)
        }}
        onClick={(event) => onOpen(item, keyboardTiles.current.get(item.id) ?? event.currentTarget)}
      >
        <span className="drift-wall__inner">
          <img src={item.image} alt="" loading="lazy" decoding="async" draggable={false} />
          <span className="drift-wall__overlay" aria-hidden="true" />
          <span className="drift-wall__label" aria-hidden="true">{item.title}</span>
        </span>
      </button>
    )
  }

  return (
    <div className="drift-gallery">
      <div ref={wall} className={`drift-wall ${staticWall ? 'drift-wall--static' : ''}`} data-visible={visible}
        style={{ '--dw-width': `${tileWidth}px`, '--dw-height': `${tileHeight}px`, '--dw-gap': `${gap}px`, '--dw-columns': columns }}
        role="group" aria-label="视频封面墙">
        {staticWall ? (
          <div className="drift-wall__static">{items.map((item) => renderTile(item, 0, false))}</div>
        ) : (
          <div className="drift-wall__plane">
            {groups.map((group, index) => {
              const copies = Math.ceil(size.height * 1.45 / (group.length * row)) + 2
              return (
                <div key={index} className="drift-wall__col" style={{ '--dw-delay': `${index * 60}ms` }}
                  onPointerEnter={() => { hovered.current = index }}
                  onPointerLeave={() => { hovered.current = -1 }}>
                  <div className="drift-wall__track" ref={(node) => { tracks.current[index] = node }}>
                    {Array.from({ length: copies }, (_, copy) => (
                      <React.Fragment key={copy}>{group.map((item) => renderTile(item, index, copy !== 1))}</React.Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="drift-wall__footer">
        <span className="mono">{String(items.length).padStart(2, '0')} FILMS</span>
        <div className="drift-wall__preview">
          {preview ? <><strong>{preview.title}</strong><span>{preview.category} · {preview.duration}</span></> : <p>点击封面查看详情与成片</p>}
        </div>
        {!staticWall && <button type="button" className="button button-outline" onClick={() => setPaused(!paused)}>{paused ? '继续漂移' : '暂停漂移'}</button>}
      </div>
    </div>
  )
}
