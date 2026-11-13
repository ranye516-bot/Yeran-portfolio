import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function openHero() {
  const hero = document.getElementById('top')
  const curtain = document.querySelector('.opening-curtain')
  const clip = curtain.querySelector('.opening-clip')
  const progress = curtain.querySelector('.opening-progress')
  hero.dataset.opening = 'true'
  gsap.set(curtain, { autoAlpha: 1 })
  gsap.from('.opening-name, .opening-status', { y: 7, opacity: 0, duration: 0.52, ease: 'power3.out' })

  const handoff = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
  handoff
    .to(curtain, { autoAlpha: 0, duration: 0.47, clearProps: 'opacity,visibility' }, 0)
    .from('.hero-media > img', { scale: 1.05, duration: 0.94 }, 0)
    .from('.hero-label', { yPercent: 120, duration: 0.58 }, 0.06)
    .from('.hero h1', { yPercent: 106, duration: 0.76 }, 0.12)
    .from('.hero-edition', { yPercent: 115, duration: 0.58 }, 0.25)
    .fromTo('.site-header', { clipPath: 'inset(0 49% 0 49% round 99px)', autoAlpha: 0 },
      { clipPath: 'inset(0 0% 0 0% round 99px)', autoAlpha: 1, duration: 0.65, clearProps: 'clipPath,opacity,visibility' }, 0.19)
    .fromTo('.hero-byline', { y: 31, clipPath: 'inset(0 0 100% 0)' },
      { y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.61, clearProps: 'clipPath' }, 0.30)
    .from('.hero-footer', { y: 20, autoAlpha: 0, duration: 0.51 }, 0.38)

  let finished = false
  const timeout = window.setTimeout(finish, 7000)
  const startupTimeout = window.setTimeout(finish, 2300)
  const started = () => window.clearTimeout(startupTimeout)

  function updateProgress() {
    if (Number.isFinite(clip.duration) && clip.duration > 0) {
      progress.style.transform = `scaleX(${Math.min(1, clip.currentTime / clip.duration)})`
    }
  }

  function detach() {
    window.clearTimeout(timeout)
    window.clearTimeout(startupTimeout)
    clip.removeEventListener('playing', started)
    clip.removeEventListener('timeupdate', updateProgress)
    clip.removeEventListener('ended', finish)
    clip.removeEventListener('error', finish)
  }

  function finish() {
    if (finished) return
    finished = true
    detach()
    clip.pause()
    clip.removeAttribute('src')
    clip.load()
    delete hero.dataset.opening
    hero.dispatchEvent(new Event('opening-finished'))
    progress.style.transform = 'scaleX(1)'
    handoff.play()
  }

  clip.addEventListener('timeupdate', updateProgress)
  clip.addEventListener('playing', started, { once: true })
  clip.addEventListener('ended', finish)
  clip.addEventListener('error', finish)
  clip.poster = clip.dataset.poster
  clip.src = clip.dataset.src
  clip.play().catch(finish)

  return () => {
    finished = true
    detach()
    clip.pause()
    clip.removeAttribute('src')
    clip.removeAttribute('poster')
    clip.load()
    delete hero.dataset.opening
    hero.dispatchEvent(new Event('opening-finished'))
    progress.style.removeProperty('transform')
  }
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
    let opened = false
    preferences.add('(prefers-reduced-motion: no-preference)', () => {
      let stopOpening
      if (!opened && window.scrollY < 35 && ['', '#top'].includes(window.location.hash)) {
        stopOpening = openHero()
        opened = true
      }
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
        stopOpening?.()
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
