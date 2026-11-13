import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function revealHero(curtain, onComplete) {
  const handoff = gsap.timeline({ defaults: { ease: 'power3.out' } })
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
    .call(onComplete, [], 0.47)

  return handoff
}

export function useSiteOpening(setOpening) {
  useLayoutEffect(() => {
    const curtain = document.getElementById('site-opening')
    const root = document.getElementById('root')
    const clip = curtain.querySelector('.opening-clip')
    const progress = curtain.querySelector('.opening-progress')
    const track = progress.parentElement
    const percentage = curtain.querySelector('.opening-percentage')
    const message = curtain.querySelector('.opening-message')
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const startsAtHero = window.scrollY < 35 && ['', '#top'].includes(window.location.hash)
    const animate = startsAtHero && !preference.matches
    const poster = document.querySelector('.hero-media > img')
    const video = startsAtHero ? document.querySelector('.hero-media > video') : null
    const listeners = new AbortController()
    const options = { signal: listeners.signal }
    let posterTimeout
    let videoTimeout
    let cameraTimeout
    let progressTween
    let handoff
    let finishing = false
    let posterReady = !startsAtHero || poster.complete
    let videoReady = !video
    let buffered = 0
    let usingPoster = false
    let cameraDone = !animate
    let cameraBuffering = animate

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
      if (animate && !preference.matches && !document.hidden) handoff = revealHero(curtain, unlock)
      else unlock()
    }

    function update() {
      if (finishing) return
      const ready = posterReady && videoReady
      const value = ready ? 1 : 0.10 + (posterReady ? 0.15 : 0) + 0.75 * (videoReady ? 1 : buffered)
      const percent = ready ? 100 : Math.min(99, Math.floor(value * 100))
      if (track.getAttribute('aria-valuenow') !== String(percent)) {
        track.setAttribute('aria-valuenow', percent)
        percentage.textContent = `${percent}%`
      }
      if (!ready || !cameraDone) {
        progressTween = gsap.to(progress, {
          scaleX: value, duration: 0.2, ease: 'none', overwrite: true,
        })
        const status = !posterReady ? '正在载入首页封面'
          : !videoReady ? '正在缓冲首页视频'
          : cameraBuffering ? '首页已就绪，正在缓冲开场' : '首页已就绪，正在播放开场'
        if (message.textContent !== status) message.textContent = status
        return
      }
      finishing = true
      clearTimeout(posterTimeout)
      clearTimeout(videoTimeout)
      clearTimeout(cameraTimeout)
      listeners.abort()
      message.textContent = usingPoster ? '即将进入，视频继续缓冲' : '载入完成'
      if (animate && !preference.matches && !document.hidden) {
        progressTween = gsap.to(progress, {
          scaleX: 1, duration: 0.18, ease: 'none', overwrite: true, onComplete: enter,
        })
      } else {
        progressTween?.kill()
        gsap.set(progress, { scaleX: 1 })
        enter()
      }
    }

    function finishPoster() {
      clearTimeout(posterTimeout)
      posterReady = true
      update()
    }

    function checkBuffer() {
      if (videoReady) return
      const target = Math.min(1.25, video.duration || 1.25)
      const initialSeconds = video.buffered.length && video.buffered.start(0) < 0.05 ? video.buffered.end(0) : 0
      buffered = Math.max(buffered, Math.min(0.99, initialSeconds / target))
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA && initialSeconds >= target) {
        videoReady = true
        clearTimeout(videoTimeout)
      }
      update()
    }

    function usePoster() {
      if (videoReady) return
      clearTimeout(videoTimeout)
      usingPoster = true
      videoReady = true
      update()
    }

    function finishCamera() {
      if (cameraDone) return
      clearTimeout(cameraTimeout)
      clip.pause()
      cameraDone = true
      update()
    }

    if (!posterReady) {
      poster.addEventListener('load', finishPoster, options)
      poster.addEventListener('error', finishPoster, options)
      posterTimeout = window.setTimeout(finishPoster, 2000)
    }

    if (video) {
      for (const event of ['loadeddata', 'progress', 'canplay', 'canplaythrough']) {
        video.addEventListener(event, checkBuffer, options)
      }
      video.addEventListener('error', usePoster, options)
      videoTimeout = window.setTimeout(usePoster, 5500)
      if (video.error) usePoster()
      else checkBuffer()
    }

    if (animate) {
      const waitForCamera = () => {
        if (cameraDone) return
        cameraBuffering = true
        update()
        clearTimeout(cameraTimeout)
        cameraTimeout = window.setTimeout(finishCamera, 5000)
      }
      clip.addEventListener('waiting', waitForCamera, options)
      clip.addEventListener('playing', () => {
        clearTimeout(cameraTimeout)
        cameraBuffering = false
        update()
      }, options)
      clip.addEventListener('ended', finishCamera, options)
      clip.addEventListener('error', finishCamera, options)
      waitForCamera()
      if (!clip.hasAttribute('src')) clip.src = clip.dataset.src
      clip.play().catch(finishCamera)
    }

    preference.addEventListener('change', () => {
      if (preference.matches) {
        usePoster()
        finishCamera()
      }
    }, options)

    update()

    return () => {
      clearTimeout(posterTimeout)
      clearTimeout(videoTimeout)
      clearTimeout(cameraTimeout)
      listeners.abort()
      progressTween?.kill()
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
