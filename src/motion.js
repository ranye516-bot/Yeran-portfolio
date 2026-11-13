import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { media } from './content'

gsap.registerPlugin(ScrollTrigger)

function revealHero(curtain, onComplete) {
  const handoff = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete })
  handoff
    .to(curtain, { autoAlpha: 0, duration: 0.47 }, 0)
    .from('.hero-media > img', { scale: 1.05, duration: 0.94 }, 0)
    .from('.hero-label', { yPercent: 120, duration: 0.58 }, 0.06)
    .from('.hero h1', { yPercent: 106, duration: 0.76 }, 0.12)
    .from('.hero-edition', { yPercent: 115, duration: 0.58 }, 0.25)
    .fromTo('.site-header', { clipPath: 'inset(0 49% 0 49% round 99px)', autoAlpha: 0 },
      { clipPath: 'inset(0 0% 0 0% round 99px)', autoAlpha: 1, duration: 0.65, clearProps: 'clipPath,opacity,visibility' }, 0.19)
    .fromTo('.hero-byline', { y: 31, clipPath: 'inset(0 0 100% 0)' },
      { y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.61, clearProps: 'clipPath' }, 0.30)
    .from('.hero-footer', { y: 20, autoAlpha: 0, duration: 0.51 }, 0.38)

  return handoff
}

export function useSiteOpening(setOpening) {
  useLayoutEffect(() => {
    const curtain = document.getElementById('site-opening')
    const root = document.getElementById('root')
    const clip = curtain.querySelector('.opening-clip')
    const progress = curtain.querySelector('.opening-progress')
    const message = curtain.querySelector('.opening-message')
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const startsAtHero = window.scrollY < 35 && ['', '#top'].includes(window.location.hash)
    const animate = startsAtHero && !preference.matches
    const poster = document.querySelector('.hero-media > img')
    const heroVideo = document.querySelector('.hero-media > video')
    const pending = new Set(startsAtHero ? [poster, heroVideo].filter(Boolean) : [])
    const total = pending.size + 1 // The React page is already mounted.
    const listeners = new AbortController()
    const options = { signal: listeners.signal }
    let deadline
    let cameraGrace
    let handoff
    let entering = false
    let cameraPlaying = false

    function unlock() {
      curtain.hidden = true
      clip.removeAttribute('src')
      clip.load()
      root.inert = false
      document.documentElement.classList.remove('site-loading')
      setOpening(false)
      ScrollTrigger.refresh(true)
    }

    function enter() {
      if (entering) return
      entering = true
      clearTimeout(deadline)
      clearTimeout(cameraGrace)
      listeners.abort()
      clip.pause()
      if (animate && !preference.matches && !document.hidden) handoff = revealHero(curtain, unlock)
      else unlock()
    }

    function update() {
      progress.style.transform = `scaleX(${(total - pending.size) / total})`
      if (pending.size) return
      clearTimeout(deadline)
      message.textContent = '载入完成'
      if (cameraPlaying && !clip.ended) cameraGrace = window.setTimeout(enter, 900)
      else enter()
    }

    function watch(asset, event, ready) {
      if (!pending.has(asset)) return
      const settled = () => {
        if (pending.delete(asset)) update()
      }
      asset.addEventListener(event, settled, options)
      asset.addEventListener('error', settled, options)
      if (ready()) settled()
    }

    if (animate) {
      clip.addEventListener('playing', () => { cameraPlaying = true }, options)
      clip.addEventListener('ended', () => { if (!pending.size) enter() }, options)
      clip.src = media('intro-camera.mp4')
      clip.play().catch(() => {})
    }

    preference.addEventListener('change', () => {
      if (!preference.matches) return
      clip.pause()
      if (pending.delete(heroVideo)) update()
    }, options)

    // Keep the poster available as a fallback when a first frame takes too long.
    deadline = window.setTimeout(enter, 6000)
    watch(poster, 'load', () => poster.complete)
    watch(heroVideo, 'loadeddata', () => heroVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || heroVideo.error)
    if (!entering) update()

    return () => {
      clearTimeout(deadline)
      clearTimeout(cameraGrace)
      listeners.abort()
      handoff?.kill()
    }
  }, [setOpening])
}

function revealSection(section) {
  const heading = section.querySelector('[data-display]')
  const copy = section.querySelectorAll('[data-motion-copy]')
  const cards = section.querySelectorAll('[data-motion-card]')
  const covers = section.querySelectorAll('[data-motion-cover]')
  const timeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: heading.parentElement, start: 'top 86%', once: true },
  })

  timeline.from(heading, { yPercent: 118, scaleX: 0.85, skewX: -6, duration: 1.25, transformOrigin: 'left bottom' }, 0)
  if (copy.length) timeline.from(copy, { y: 29, opacity: 0, duration: 0.77, stagger: 0.07 }, 0.55)
  if (cards.length) {
    timeline.fromTo(cards, { y: 39, clipPath: 'inset(100% 0 0 0)' },
      { y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.92, stagger: 0.1, clearProps: 'clipPath' }, 0.71)
  }
  if (covers.length) {
    // Keep the reveal separate from the transforms used by the orbit and the carousel.
    timeline.fromTo(covers, { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0% 0 0 0)', duration: 0.95, stagger: 0.06, clearProps: 'clipPath' }, 0.64)
  }
}

function revealMetrics() {
  const metrics = document.querySelector('.metrics')
  gsap.timeline({ scrollTrigger: { trigger: metrics, start: 'top 91%', once: true } })
    .fromTo(metrics, { '--metrics-reveal': 0 }, { '--metrics-reveal': 1, duration: 0.94, ease: 'power2.inOut' })
    .from(metrics.querySelectorAll('dd'), { y: 18, opacity: 0, duration: 0.62, stagger: 0.16, ease: 'power3.out' }, 0.26)
}

function connectSections() {
  const about = document.getElementById('about')
  const screening = document.getElementById('screening')
  const stage = screening.querySelector('.screening-stage')

  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: about, start: 'top bottom', end: 'top 23%', scrub: 0.6 },
  })
    .to('.hero-media', { yPercent: 8, scale: 1.1 }, 0)
    .to('.hero-masthead', { yPercent: -18, opacity: 0.22 }, 0)
    .to('.hero-exit-shade', { opacity: 1 }, 0)
    .fromTo(about.querySelector('.section-edge'), { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1 }, 0)
    .fromTo(about.querySelector('.about-grid'), { y: 44 }, { y: 0 }, 0.12)

  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: screening, start: 'top bottom', end: 'top 18%', scrub: 0.6 },
  })
    .fromTo(screening.querySelector('.section-edge'), { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1 }, 0)
    .fromTo(screening.querySelector('.screening-intro'), { y: 34 }, { y: 0 }, 0)
    .fromTo(stage, { y: 56, clipPath: 'inset(0% 29% 0% 29%)' }, { y: 0, clipPath: 'inset(0% 0% 0% 0%)' }, 0.12)
    .set(stage, { clipPath: 'none' })
}

export function usePortfolioMotion() {
  useLayoutEffect(() => {
    const preferences = gsap.matchMedia()
    preferences.add('(prefers-reduced-motion: no-preference)', () => {
      document.querySelectorAll('[data-motion-section]').forEach(revealSection)
      revealMetrics()
      connectSections()
      gsap.from('.contact-light', {
        scale: 0.72, xPercent: 18, yPercent: 16, opacity: 0.3, ease: 'none',
        scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'center center', scrub: 1.1 },
      })
      const experience = document.querySelector('.experience')
      let refreshFrame = 0
      const refreshLayout = () => {
        cancelAnimationFrame(refreshFrame)
        refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh(true))
      }
      const layoutObserver = new ResizeObserver(refreshLayout)
      layoutObserver.observe(document.querySelector('.video-library'))
      layoutObserver.observe(document.getElementById('screening'))
      experience.addEventListener('toggle', refreshLayout)
      return () => {
        experience.removeEventListener('toggle', refreshLayout)
        layoutObserver.disconnect()
        cancelAnimationFrame(refreshFrame)
      }
    })

    preferences.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
      for (const section of document.querySelectorAll('#about, #work')) {
        const images = section.querySelectorAll('[data-parallax]')
        gsap.fromTo(images, { yPercent: -3, scale: 1.08 }, {
          yPercent: 3,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: { trigger: images[0].parentElement.closest('.portrait, .carousel-stage'), start: 'top bottom', end: 'bottom top', scrub: 1.15 },
        })
      }
    })
    return () => preferences.revert()
  }, [])
}
