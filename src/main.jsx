import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { experience, featuredArchiveIds, media, metrics, projects, screening, strengths } from './content'
import contact from './contact.json'
import videoLibrary from './video-library.json'
import ProfileCard from './ProfileCard'
import Grainient from './Grainient'
import { usePortfolioMotion } from './motion'
import './styles.css'

const DriftWall = lazy(() => import('./DriftWall'))

const screeningItems = screening.map(({ id, frame, companion, detail, ...entry }) => ({
  ...entry,
  id,
  image: media(`${id}/${frame}`),
  companionImage: media(`${id}/${companion}`),
  detailImage: detail && media(`${id}/${detail}`),
  project: projects.find((project) => project.id === id),
}))
const carouselProjects = [
  ...projects.filter(({ id }) => !screeningItems.some((item) => item.id === id)),
  ...featuredArchiveIds.map((id) => videoLibrary.find((item) => item.id === id)),
]
const showcasedIds = new Set([...screeningItems, ...carouselProjects].map(({ id }) => id))
const archiveItems = videoLibrary
  .filter(({ id }) => !showcasedIds.has(id))
  .map((project) => ({ ...project, image: media(`${project.id}/cover.webp`) }))
const screeningInterval = 5200
const archiveFilters = [
  { label: '全部', items: archiveItems },
  { label: '产品', items: archiveItems.filter(({ category }) => ['产品影像', '产品主图', '定格影像', '短视频'].includes(category)) },
  { label: '品牌', items: archiveItems.filter(({ category }) => category.startsWith('品牌')) },
  { label: '空间', items: archiveItems.filter(({ category }) => category === '空间影像') },
  { label: '美食', items: archiveItems.filter(({ category }) => category === '美食影像') },
]

const icons = {
  diagonal: <path d="M5 19 19 5M7 5h12v12" />,
  down: <path d="M12 4v16m-6-6 6 6 6-6" />,
  up: <path d="M12 20V4m-6 6 6-6 6 6" />,
  left: <path d="m14 5-7 7 7 7" />,
  right: <path d="m10 5 7 7-7 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  play: <path d="m9 5 11 7-11 7z" />,
  pause: <path d="M9 5v14m6-14v14" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M16 8V4H4v12h4" /></>,
}

function Icon({ name, className }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}

function Chapter({ number, label }) {
  return <p className="chapter mono"><span>{number}</span><i />{label}</p>
}

function DisplayTitle({ children }) {
  return <div className="motion-mask"><p className="display-heading" lang="en" aria-hidden="true" data-display>{children}</p></div>
}

function Brand() {
  return <a className="brand" href="#top" aria-label="叶然，回到首页"><span className="brand-mark">Y<span>.</span></span>YERAN<span className="brand-slash">/</span></a>
}

function Navbar() {
  const [floating, setFloating] = useState(() => window.scrollY > 48)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setFloating(!entry.isIntersecting))
    observer.observe(document.querySelector('.hero-scroll-marker'))
    return () => observer.disconnect()
  }, [])

  return (
    <header className={`site-header ${floating ? 'is-floating' : ''}`}>
      <Brand />
      <nav aria-label="主导航">
        <a href="#screening">作品</a>
        <a href="#video-library">更多作品</a>
        <a href="#about">关于</a>
        <a href="#skills">能力</a>
      </nav>
      <a className="header-contact" href="#contact">联系我 <Icon name="diagonal" /></a>
    </header>
  )
}

function HeroOpening() {
  return (
    <div className="opening-curtain">
      <p className="opening-name" lang="en" aria-hidden="true">YERAN</p>
      <div className="opening-stage">
        <div className="opening-camera" aria-hidden="true">
          <video className="opening-clip" data-src={media('intro-camera.mp4')} data-poster={media('intro-camera-poster.webp')} muted playsInline preload="none" />
        </div>
        <div className="opening-status" role="status">
          <span className="opening-track" aria-hidden="true"><span className="opening-progress" /></span>
          <span>正在载入</span>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  const hero = useRef(null)
  const video = useRef(null)
  const [paused, setPaused] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)
  const [visible, setVisible] = useState(false)
  const [opening, setOpening] = useState(false)
  const [source, setSource] = useState(null)
  const [allowMotion, setAllowMotion] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAllowMotion(!preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const section = hero.current
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15), { threshold: 0.15 })
    const openingFinished = () => setOpening(false)
    setOpening(section.dataset.opening === 'true')
    section.addEventListener('opening-finished', openingFinished)
    observer.observe(section)
    return () => {
      observer.disconnect()
      section.removeEventListener('opening-finished', openingFinished)
    }
  }, [])

  useEffect(() => {
    if (!source && visible && !opening && allowMotion && available) {
      setSource(media(window.matchMedia('(max-width: 640px)').matches ? 'hero-mobile.mp4' : 'hero.mp4'))
    }
  }, [source, visible, opening, allowMotion, available])

  useEffect(() => {
    const player = video.current
    if (!player) return
    function syncPlayback() {
      if (visible && !opening && !paused && !document.hidden) player.play().catch(() => {})
      else player.pause()
    }
    syncPlayback()
    document.addEventListener('visibilitychange', syncPlayback)
    return () => document.removeEventListener('visibilitychange', syncPlayback)
  }, [source, visible, opening, paused, allowMotion, available])

  function toggleVideo() {
    const player = video.current
    const nextPaused = !player.paused
    setPaused(nextPaused)
    if (nextPaused) player.pause()
    else player.play().catch(() => {})
  }

  return (
    <section className="hero" id="top" aria-labelledby="hero-title" ref={hero}>
      <span className="hero-scroll-marker" aria-hidden="true" />
      <div className="hero-media" aria-hidden="true">
        <img src={media('hero-poster.webp')} alt="" fetchPriority="high" />
        {source && allowMotion && available && (
          <video ref={video} muted playsInline loop preload="none" poster={media('hero-poster.webp')} src={source} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setAvailable(false)} />
        )}
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-exit-shade" aria-hidden="true" />
      <HeroOpening />
      <div className="hero-body wrap">
        <div className="hero-masthead">
          <div className="motion-mask"><p className="hero-label" lang="en">PHOTOGRAPHY <span>/</span> VISUAL CREATION</p></div>
          <div className="motion-mask"><h1 id="hero-title" lang="en">PORTFOLIO</h1></div>
          <div className="motion-mask"><p className="hero-edition">2026<span className="mono">/ 作品集版本</span></p></div>
        </div>
        <div className="hero-byline">
          <p className="hero-signature" lang="en">YERAN</p>
          <p className="hero-role">摄影师 <span>/</span> 视觉创作者</p>
          <a className="text-link" href="#screening">浏览精选作品 <Icon name="diagonal" /></a>
        </div>
      </div>
      <div className="hero-footer wrap">
        <a href="#about" className="mono scroll-link"><Icon name="down" /> 向下浏览</a>
        <span className="hero-location mono">HANGZHOU, CN</span>
        {source && allowMotion && available && (
          <button type="button" className="icon-button hero-toggle" onClick={toggleVideo} aria-label={playing ? '暂停背景视频' : '播放背景视频'} title={playing ? '暂停背景视频' : '播放背景视频'}>
            <Icon name={playing ? 'pause' : 'play'} />
          </button>
        )}
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="about" className="section about" data-motion-section>
      <div className="section-edge" aria-hidden="true" />
      <div className="wrap">
        <Chapter number="02" label="PRACTICE / 影像能力" />
        <DisplayTitle>Behind the Lens</DisplayTitle>
        <div className="about-grid">
          <ProfileCard avatarUrl={media('portrait.webp')} smallAvatarUrl={media('portrait-small.webp')} />
          <div className="about-info">
            <h2 className="section-title" data-motion-copy>从构思到成片</h2>
            <div className="about-credentials" data-motion-copy>
              <p><strong>7 年</strong><span>影视行业经验</span></p>
              <ul aria-label="已通过的认证">
                <li>调色认证</li>
                <li>松下视频认证</li>
              </ul>
            </div>
            <dl id="skills" className="skills-list" aria-label="工作能力">
              {strengths.map(({ title, details }) => (
                <div key={title} data-motion-copy>
                  <dt>{title}</dt>
                  <dd>{details}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <dl className="metrics">
          {metrics.map(({ value, unit, label }) => (
            <div key={label}><dt>{label}</dt><dd>{value}<span>{unit}</span></dd></div>
          ))}
        </dl>
        <details className="experience">
          <summary><span>工作经历</span><span className="mono">CAREER / 03</span><Icon name="down" /></summary>
          <ul className="timeline">
            {experience.map(({ period, company, description }) => (
              <li key={company}>
                <span className="mono period">{period}</span>
                <div><h3>{company}</h3><p>{description}</p></div>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  )
}

function ProjectCard({ project, index, offset, onSelect }) {
  const distance = Math.abs(offset)
  const edge = Math.min(2.45, carouselProjects.length / 2)
  const visible = distance < edge
  const focused = distance < 0.5
  const defocus = Math.max(0, distance - 0.5)
  const edgeFade = Math.min(1, Math.max(0, (edge - distance) / 0.35))
  const action = offset === 0 ? (project.duration ? '播放' : '查看图集') : '切换到'
  return (
    <article className={`project-card project-${project.id}`} data-focused={focused} aria-hidden={!visible} style={{
      '--offset': offset,
      '--distance': distance,
      '--defocus': defocus,
      zIndex: Math.round(100 - distance * 20),
      opacity: edgeFade * (1 - Math.min(0.26, defocus * 0.34)),
      visibility: visible ? 'visible' : 'hidden',
    }}>
      <button className="project-trigger" type="button" data-motion-cover onClick={onSelect} tabIndex={focused ? 0 : -1} aria-label={`${action} ${project.title}${project.subtitle ? ` · ${project.subtitle}` : ''}`}>
        <img src={media(`${project.id}/${project.cardImage || 'cover.webp'}`)} alt="" loading="lazy" draggable="false" data-parallax={project.portrait ? undefined : ''} />
        <span className="card-meta">
          <span className="card-index mono">{String(index + 1).padStart(2, '0')} / {project.category} / {project.duration || '图集'}</span>
          <span className="card-title">{project.title}{project.subtitle && <small>{project.subtitle}</small>}</span>
        </span>
        <span className="card-play"><Icon name={project.duration ? 'play' : 'diagonal'} /></span>
      </button>
    </article>
  )
}

function stillFile(project, index) {
  return media(`${project.id}/${String(index + 1).padStart(2, '0')}.webp`)
}

function ProjectFilm({ project, poster }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`film-panel ${project.portrait ? 'film-portrait' : ''}`}>
      {failed ? (
        <div className="film-error">
          <p role="status">成片加载失败</p>
          <button type="button" className="button button-outline" onClick={() => setFailed(false)}>重新播放 <Icon name="play" /></button>
        </div>
      ) : (
        <video src={media(`${project.id}/film.mp4`)} poster={poster} controls autoPlay playsInline preload="metadata" onError={() => setFailed(true)} aria-label={`${project.title}成片`} />
      )}
    </div>
  )
}

function ProjectDialog({ project, close, coverOrigin }) {
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const movingCover = useRef(null)
  const [index, setIndex] = useState(0)
  const [watching, setWatching] = useState(Boolean(project.duration))
  const hasStills = Boolean(project.count)
  const previous = () => setIndex((current) => (current - 1 + project.count) % project.count)
  const next = () => setIndex((current) => (current + 1) % project.count)

  const poster = media(`${project.id}/${project.cardImage || 'cover.webp'}`)

  useLayoutEffect(() => {
    const detail = dialog.current
    detail.showModal()
    closeButton.current.focus()
    if (!coverOrigin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const player = detail.querySelector('.film-panel')
    const cover = movingCover.current
    const target = player.getBoundingClientRect()
    if (!target.width || !target.height) return
    Object.assign(cover.style, {
      left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px`,
    })
    cover.hidden = false
    const timing = { duration: 590, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    const transition = cover.animate([
      { transform: `translate(${coverOrigin.left - target.left}px, ${coverOrigin.top - target.top}px) scale(${coverOrigin.width / target.width}, ${coverOrigin.height / target.height})` },
      { transform: 'none', offset: .88 },
      { transform: 'none', opacity: 0 },
    ], timing)
    const revealPlayer = player.animate([{ opacity: 0 }, { opacity: 0, offset: .7 }, { opacity: 1 }], timing)
    transition.onfinish = () => { cover.hidden = true }
    return () => {
      transition.cancel()
      revealPlayer.cancel()
    }
  }, [])

  function keyboard(event) {
    if (watching) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      if (event.key === 'ArrowLeft') previous()
      else next()
    }
  }

  return (
    <dialog className="project-dialog" data-case={Boolean(project.caseStills)} aria-labelledby="project-title" ref={dialog} onClose={close} onKeyDown={keyboard} onClick={(event) => {
      if (event.target === event.currentTarget) event.currentTarget.close()
    }}>
      <div className="project-detail">
        <div className="dialog-header">
          <div>
            <p className="mono project-category">{project.category} / PROJECT</p>
            <h2 id="project-title">{project.title}{project.subtitle && <span className="project-subtitle">{project.subtitle}</span>}</h2>
          </div>
          <button type="button" className="icon-button project-close" ref={closeButton} aria-label="关闭项目详情" onClick={() => dialog.current.close()}><Icon name="close" /></button>
        </div>
        <div className="dialog-actions">
          {project.duration && hasStills && (
            <button type="button" className={`button ${watching ? 'button-outline' : 'button-accent'}`} onClick={() => setWatching(!watching)}>
              {watching ? '返回剧照' : '播放成片'} <Icon name={watching ? 'left' : 'play'} />
            </button>
          )}
          <span className="mono">{watching ? project.duration : `剧照 ${index + 1} / ${project.count}`}</span>
        </div>
        {watching ? (
          <ProjectFilm project={project} poster={poster} />
        ) : (
          <>
            <div className="still-panel">
              <img src={stillFile(project, index)} alt={`${project.title} · 剧照 ${index + 1}`} />
              <button className="icon-button still-prev" type="button" onClick={previous} aria-label="上一张剧照"><Icon name="left" /></button>
              <button className="icon-button still-next" type="button" onClick={next} aria-label="下一张剧照"><Icon name="right" /></button>
            </div>
            <div className="still-list" aria-label="项目剧照">
              {Array.from({ length: project.count }, (_, i) => (
                <button type="button" aria-label={`查看第 ${i + 1} 张剧照`} aria-pressed={i === index} key={i} onClick={() => setIndex(i)}>
                  <img src={stillFile(project, i)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </>
        )}
        {project.caseStills ? (
          <section className="project-case" aria-labelledby="case-title">
            <div className="project-case__intro">
              <h3 id="case-title">拍摄笔记</h3>
              <p>{project.note}</p>
            </div>
            <div className="project-case__frames">
              {project.caseStills.map(({ index, title, caption }) => (
                <figure key={index}>
                  <img src={stillFile(project, index)} alt={title} loading="lazy" />
                  <figcaption><strong>{title}</strong><p>{caption}</p></figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : project.note && <p className="project-note">{project.note}</p>}
      </div>
      {coverOrigin && <img className="project-transition-cover" ref={movingCover} src={poster} alt="" aria-hidden="true" hidden />}
    </dialog>
  )
}

function Work() {
  const [active, setActive] = useState(null)
  const [position, setPosition] = useState(0)
  const [dragging, setDragging] = useState(false)
  const positionRef = useRef(0)
  const animation = useRef(0)
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const trigger = useRef(null)
  const count = carouselProjects.length
  const current = ((Math.round(position) % count) + count) % count
  const currentProject = carouselProjects[current]

  useEffect(() => () => cancelAnimationFrame(animation.current), [])

  function updatePosition(value) {
    positionRef.current = value
    setPosition(value)
  }

  function moveTo(target) {
    cancelAnimationFrame(animation.current)
    const start = positionRef.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(target - start) < 0.01) {
      updatePosition(target)
      return
    }
    const started = performance.now()
    function frame(now) {
      const t = Math.min(1, (now - started) / 440)
      updatePosition(t === 1 ? target : start + (target - start) * (1 - (1 - t) ** 3))
      if (t < 1) animation.current = requestAnimationFrame(frame)
    }
    animation.current = requestAnimationFrame(frame)
  }

  function changeSlide(direction, keyboardRegion) {
    const target = Math.round(positionRef.current) + direction
    moveTo(target)
    if (keyboardRegion) {
      const nextProject = carouselProjects[((target % count) + count) % count]
      keyboardRegion.querySelector(`.project-${nextProject.id} button`)?.focus({ preventScroll: true })
    }
  }

  function beginDrag(event) {
    if (!event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: positionRef.current,
      step: Math.max(100, Math.min(event.currentTarget.clientWidth * 0.18, 285)),
      moved: false,
    }
  }

  function drag(event) {
    const interaction = gesture.current
    if (interaction?.id !== event.pointerId) return
    const dx = event.clientX - interaction.x
    const dy = event.clientY - interaction.y
    if (!interaction.moved) {
      if (event.pointerType === 'touch' && Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null
        return
      }
      if (Math.abs(dx) < 9) return
      cancelAnimationFrame(animation.current)
      interaction.start = positionRef.current
      interaction.moved = true
      suppressClick.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    updatePosition(interaction.start - dx / interaction.step)
  }

  function endDrag(event) {
    const interaction = gesture.current
    if (interaction?.id !== event.pointerId) return
    gesture.current = null
    if (!interaction.moved) return
    setDragging(false)
    const change = positionRef.current - interaction.start
    const start = Math.round(interaction.start)
    let target = Math.round(positionRef.current)
    if (event.type === 'pointerup' && target === start && Math.abs(change) >= 0.24) {
      target += Math.sign(change)
    }
    moveTo(target)
  }

  return (
    <section id="work" className="section work" data-motion-section>
      <div className="wrap">
        <Chapter number="04" label="SELECTED WORK / 作品" />
        <DisplayTitle>Selected Work</DisplayTitle>
        <div className="section-heading">
          <h2 className="section-title" data-motion-copy>精选项目</h2>
          <div className="work-intro" data-motion-copy>
            <p>拖动或点两侧卡片切换，点中央卡片查看作品。</p>
            <a className="text-link" href="#video-library">浏览更多视频 <Icon name="down" /></a>
          </div>
        </div>
      </div>
      <div className="work-carousel" role="region" aria-label="精选项目轮播" onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          changeSlide(event.key === 'ArrowLeft' ? -1 : 1, event.target.closest('.project-trigger') ? event.currentTarget : null)
        }
      }}>
        <div className="carousel-stage" data-dragging={dragging} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) endDrag(event)
        }} onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault()
            event.stopPropagation()
            suppressClick.current = false
          }
        }}>
          {carouselProjects.map((project, index) => {
            const target = index - count * Math.round((index - position) / count)
            return <ProjectCard key={project.id} project={project} index={index} offset={target - position} onSelect={(event) => {
              if (target !== positionRef.current) {
                moveTo(target)
                return
              }
              trigger.current = event.currentTarget
              setActive({ project, coverOrigin: project.caseStills ? event.currentTarget.getBoundingClientRect() : undefined })
            }} />
          })}
        </div>
        <div className="carousel-toolbar wrap" data-motion-copy>
          <div className="carousel-now"><span className="mono">{String(current + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span><strong>{currentProject.title}</strong></div>
          <div className="carousel-progress" aria-hidden="true"><span style={{ width: `${100 / count}%`, transform: `translateX(${current * 100}%)` }} /></div>
          <div className="carousel-buttons">
            <button type="button" className="icon-button" aria-label="上一个项目" onClick={() => changeSlide(-1)}><Icon name="left" /></button>
            <button type="button" className="icon-button" aria-label="下一个项目" onClick={() => changeSlide(1)}><Icon name="right" /></button>
          </div>
        </div>
      </div>
      {active && <ProjectDialog project={active.project} coverOrigin={active.coverOrigin} close={() => {
        setActive(null)
        trigger.current?.focus({ preventScroll: true })
      }} />}
    </section>
  )
}

function Screening() {
  const [active, setActive] = useState(null)
  const [selection, setSelection] = useState({ current: 0, previous: null })
  const [entered, setEntered] = useState(false)
  const [visible, setVisible] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const stage = useRef(null)
  const trigger = useRef(null)
  const current = screeningItems[selection.current]
  const advancing = visible && playing && !reducedMotion && !active
  const action = current.project.duration ? '播放成片' : '查看图集'

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio >= 0.6
      setVisible(inView)
      if (inView) setEntered(true)
    }, { threshold: 0.6 })
    observer.observe(stage.current)
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', updatePreference)
    return () => {
      observer.disconnect()
      preference.removeEventListener('change', updatePreference)
    }
  }, [])

  useEffect(() => {
    if (!advancing) return
    const timeout = window.setTimeout(() => {
      setSelection(({ current }) => ({ current: (current + 1) % screeningItems.length, previous: current }))
    }, screeningInterval)
    return () => window.clearTimeout(timeout)
  }, [advancing, selection.current])

  return (
    <section id="screening" className="screening" aria-labelledby="screening-title" data-entered={entered}>
      <div className="section-edge" aria-hidden="true" />
      <div className="wrap screening-layout" style={{
        '--screening-spot': `${(selection.current + 0.5) / screeningItems.length * 100}%`,
        '--screening-interval': `${screeningInterval}ms`,
      }}>
        <header className="screening-intro">
          <Chapter number="03" label="SCREENING" />
          <h2 id="screening-title">样片放映</h2>
        </header>
        <div className="screening-stage" ref={stage}>
          <button className="screening-shot" type="button" data-switching={selection.previous !== null} aria-label={`${action} ${current.project.title}`} onFocus={(event) => {
            if (event.currentTarget.matches(':focus-visible')) setPlaying(false)
          }} onClick={(event) => {
            setPlaying(false)
            trigger.current = event.currentTarget
            setActive(current.project)
          }}>
            {screeningItems.map(({ id, image, companionImage, detailImage, project }, index) => (
              <span key={id} className="screening-frame" aria-hidden="true"
                data-current={index === selection.current} data-previous={index === selection.previous} data-portrait={project.portrait}>
                {detailImage && <img className="screening-image screening-image--detail" src={detailImage} alt="" loading="lazy" decoding="async" />}
                <img className="screening-image screening-image--main" src={image} alt="" loading="lazy" decoding="async" />
                <img className="screening-image screening-image--companion" src={companionImage} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
            <span className="screening-play" aria-hidden="true"><Icon name={current.project.duration ? 'play' : 'diagonal'} /> {action}</span>
          </button>
          {!reducedMotion && (
            <button type="button" className="screening-toggle icon-button" aria-label={playing ? '暂停样片自动切换' : '继续样片自动切换'} title={playing ? '暂停自动切换' : '继续自动切换'} onClick={() => setPlaying(!playing)}>
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
          )}
        </div>
        <div className="screening-index" role="group" aria-label="选择样片" data-advancing={advancing}>
          {screeningItems.map(({ id, label, project }, index) => (
            <button key={id} type="button" aria-pressed={selection.current === index} onFocus={(event) => {
              if (event.currentTarget.matches(':focus-visible')) setPlaying(false)
            }} onClick={() => {
              setPlaying(false)
              setSelection((selection) => selection.current === index ? selection : { current: index, previous: selection.current })
            }}>
              <span className="screening-step mono">{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
              <span className="screening-type">{project.category}</span>
            </button>
          ))}
        </div>
        <div className="screening-caption" aria-live={advancing ? 'off' : 'polite'}>
          <div key={current.id} style={{ '--screening-column': selection.current + 1 }}>
            <div className="screening-credit">
              <h3>{current.project.title}{current.project.subtitle && <small>{current.project.subtitle}</small>}</h3>
              <span className="mono">{current.project.duration}</span>
            </div>
            <p>{current.description}</p>
          </div>
        </div>
      </div>
      {active && <ProjectDialog project={active} close={() => {
        setActive(null)
        trigger.current?.focus({ preventScroll: true })
      }} />}
    </section>
  )
}

function VideoLibrary() {
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState(0)
  const [wallReady, setWallReady] = useState(false)
  const trigger = useRef(null)
  const wallSlot = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setWallReady(true)
      observer.disconnect()
    }, { rootMargin: '550px 0px' })
    observer.observe(wallSlot.current)
    return () => observer.disconnect()
  }, [])
  return (
    <section className="section video-library" id="video-library" aria-labelledby="library-title" data-motion-section>
      <div className="wrap">
        <Chapter number="05" label="FILM LIBRARY / 影像档案" />
        <DisplayTitle>Frames in Motion</DisplayTitle>
        <div className="archive-heading" data-motion-copy>
          <h2 id="library-title">更多视频作品</h2>
          <p>商业影像、产品短片与现场记录</p>
        </div>
        <div className="archive-filters" role="group" aria-label="筛选视频作品">
          {archiveFilters.map(({ label }, index) => (
            <button key={label} type="button" aria-pressed={filter === index} onClick={() => {
              setWallReady(true)
              setFilter(index)
            }}>{label}</button>
          ))}
        </div>
        <div ref={wallSlot}>
          {wallReady ? (
            <Suspense fallback={<div className="archive-placeholder" aria-hidden="true" />}>
              <DriftWall key={filter} items={archiveFilters[filter].items} filtered={filter !== 0} suspended={Boolean(active)} onOpen={(project, button) => {
                trigger.current = button
                setActive(project)
              }} />
            </Suspense>
          ) : <div className="archive-placeholder" aria-hidden="true" />}
        </div>
      </div>
      {active && <ProjectDialog project={active} close={() => {
        setActive(null)
        trigger.current?.focus({ preventScroll: true })
      }} />}
    </section>
  )
}

function Contact() {
  const [copyStatus, setCopyStatus] = useState('')

  async function copyWeChat() {
    try {
      await navigator.clipboard.writeText(contact.wechat)
      setCopyStatus('微信号已复制')
    } catch {
      setCopyStatus('请选中上方微信号手动复制')
    }
  }

  return (
    <footer id="contact" className="contact" data-motion-section>
      <div className="contact-light" aria-hidden="true" />
      <div className="wrap contact-inner">
        <Chapter number="06" label="CONTACT / 联系" />
        <div className="contact-main">
          <DisplayTitle>Let’s Talk</DisplayTitle>
          <h2 data-motion-copy>聊聊你的下一个影像项目<span>.</span></h2>
          <a className="button button-accent" data-motion-copy href={`mailto:${contact.email}`}>发送邮件 <Icon name="diagonal" /></a>
          <dl className="contact-details" data-motion-copy>
            <div>
              <dt className="mono">邮箱 / EMAIL</dt>
              <dd><a href={`mailto:${contact.secondaryEmail}`}>{contact.secondaryEmail}</a></dd>
              <dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd>
            </div>
            <div><dt className="mono">电话 / PHONE</dt><dd><a href={`tel:+86${contact.phone}`}>{contact.phone}</a></dd></div>
            <div>
              <dt className="mono">微信 / WECHAT</dt>
              <dd>{contact.wechat} <button className="copy-button" type="button" onClick={copyWeChat} aria-label="复制微信号" title="复制微信号"><Icon name="copy" /></button></dd>
              <dd className="copy-status" aria-live="polite">{copyStatus}</dd>
            </div>
          </dl>
        </div>
        <div className="footer-bar"><Brand /><span className="mono">HANGZHOU, CN</span><a className="text-link" href="#top">返回顶部 <Icon name="up" /></a></div>
      </div>
    </footer>
  )
}

function App() {
  useLayoutEffect(() => {
    const sectionId = window.location.hash.slice(1)
    if (sectionId && window.scrollY === 0) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' })
    }
  }, [])
  usePortfolioMotion()
  return (
    <>
      <a href="#screening" className="skip-link">跳到样片放映</a>
      <Grainient />
      <Navbar />
      <main><Hero /><About /><Screening /><Work /><VideoLibrary /></main>
      <Contact />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
