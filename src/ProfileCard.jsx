import React, { useRef } from 'react'
import './ProfileCard.css'

export default function ProfileCard({ avatarUrl, smallAvatarUrl }) {
  const frame = useRef(null)

  function aim(event) {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
    const box = frame.current.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    const style = frame.current.style
    style.setProperty('--pc-x', `${(x + 0.5) * 100}%`)
    style.setProperty('--pc-y', `${(y + 0.5) * 100}%`)
    style.setProperty('--pc-tilt-x', `${-y * 14}deg`)
    style.setProperty('--pc-tilt-y', `${x * 16}deg`)
    style.setProperty('--pc-shift-x', `${x * 9}px`)
    style.setProperty('--pc-shift-y', `${y * 9}px`)
  }

  function release() {
    for (const property of ['x', 'y', 'tilt-x', 'tilt-y', 'shift-x', 'shift-y']) {
      frame.current.style.removeProperty(`--pc-${property}`)
    }
  }

  return (
    <figure className="portrait profile-card" ref={frame} data-motion-cover onPointerMove={aim} onPointerLeave={release}>
      <div className="profile-card__frame">
        <div className="profile-card__image">
          <img src={avatarUrl} srcSet={`${smallAvatarUrl} 720w, ${avatarUrl} 960w`} sizes="(max-width: 640px) 90vw, (max-width: 1200px) 38vw, 610px" alt="叶然的绘画风格肖像" width="960" height="1280" loading="lazy" decoding="async" data-parallax />
          <span className="profile-card__glare" aria-hidden="true" />
        </div>
        <div className="profile-card__info">
          <div><strong lang="en">YERAN</strong><span>摄影师 / 视觉创作者</span></div>
          <a className="profile-card__contact" href="#contact" aria-label="联系叶然">↗</a>
        </div>
      </div>
    </figure>
  )
}
