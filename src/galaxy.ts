/**
 * galaxy.ts — Immersive space background.
 * Runs outside React to avoid StrictMode double-invoke.
 */

export function initGalaxy(): () => void {
  // Remove any existing galaxy canvas (handles HMR re-runs)
  document.getElementById('galaxy-canvas')?.remove()

  const canvas = document.createElement('canvas')
  canvas.id = 'galaxy-canvas'
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100vw', height: '100vh',
    pointerEvents: 'none',
    zIndex: '0',
  })
  document.body.prepend(canvas)

  const ctx = canvas.getContext('2d')!
  let W = 0, H = 0

  function resize() {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  // ── Mouse parallax ────────────────────────────────────────────────
  let mx = 0, my = 0   // smoothed
  let tmx = 0, tmy = 0 // target
  const onMouse = (e: MouseEvent) => {
    tmx = (e.clientX / W - 0.5) * 2
    tmy = (e.clientY / H - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouse)

  // ── Stars ─────────────────────────────────────────────────────────
  type Star = {
    x: number; y: number   // 0..1 normalized
    r: number              // radius px
    opa: number            // base opacity
    phase: number          // twinkle phase offset
    freq: number           // twinkle frequency
    amp: number            // twinkle amplitude
    pFactor: number        // parallax strength (px offset per unit mouse)
    color: string
    bright: boolean
  }

  const COLORS = ['#ffffff','#ffffff','#ffffff','#e8f0ff','#fff4e0','#ffe4e4','#e4fff0','#ede4ff']

  function makeStar(rMin: number, rMax: number, oMin: number, oMax: number, pFactor: number, bright = false): Star {
    return {
      x: Math.random(),
      y: Math.random(),
      r: rMin + Math.random() * (rMax - rMin),
      opa: oMin + Math.random() * (oMax - oMin),
      phase: Math.random() * Math.PI * 2,
      freq: 0.3 + Math.random() * 1.2,
      amp: 0.15 + Math.random() * 0.45,
      pFactor,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      bright,
    }
  }

  const stars: Star[] = [
    // Deep layer — 520 tiny dim stars, barely moves with mouse
    ...Array.from({ length: 520 }, () => makeStar(0.4, 1.0, 0.25, 0.55, 4)),
    // Mid layer — 280 medium stars
    ...Array.from({ length: 280 }, () => makeStar(0.8, 1.8, 0.42, 0.78, 12)),
    // Close layer — 110 large bright stars, parallax visible
    ...Array.from({ length: 110 }, () => makeStar(1.4, 3.0, 0.62, 1.00, 24)),
    // Accent bright stars with glow
    ...Array.from({ length: 22  }, () => makeStar(2.2, 4.0, 0.78, 1.00, 18, true)),
  ]

  function drawStar(s: Star, px: number, py: number, opa: number) {
    const r = s.r
    ctx.save()

    if (s.bright && r >= 2) {
      // Glow halo
      const g = ctx.createRadialGradient(px, py, 0, px, py, r * 5)
      g.addColorStop(0,    `rgba(255,255,255,${(opa * 0.5).toFixed(3)})`)
      g.addColorStop(0.4,  `rgba(180,210,255,${(opa * 0.1).toFixed(3)})`)
      g.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(px, py, r * 5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = opa
    ctx.fillStyle = s.color

    if (r < 0.9) {
      // Tiny dot
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // 4-pointed star spike
      const inn = r * 0.22
      ctx.beginPath()
      ctx.moveTo(px,       py - r)
      ctx.lineTo(px + inn, py - inn)
      ctx.lineTo(px + r,   py)
      ctx.lineTo(px + inn, py + inn)
      ctx.lineTo(px,       py + r)
      ctx.lineTo(px - inn, py + inn)
      ctx.lineTo(px - r,   py)
      ctx.lineTo(px - inn, py - inn)
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore()
  }

  // ── Shooting stars ────────────────────────────────────────────────
  type Shooter = {
    active: boolean
    x: number; y: number; vx: number; vy: number
    spd: number; maxTrail: number
    life: number; age: number
    timer: number; delay: number
  }

  const shooters: Shooter[] = Array.from({ length: 8 }, (_, i) => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, spd: 0,
    maxTrail: 0, life: 0, age: 0,
    timer: i * 800,
    delay: 1200 + Math.random() * 3800,
  }))

  function spawnShooter(sh: Shooter) {
    const ang = (20 + Math.random() * 40) * Math.PI / 180
    sh.spd = 10 + Math.random() * 14
    sh.x = Math.random() < 0.6 ? Math.random() * W : -20
    sh.y = Math.random() < 0.6 ? -20 : Math.random() * H * 0.5
    sh.vx = Math.cos(ang) * sh.spd
    sh.vy = Math.sin(ang) * sh.spd
    sh.maxTrail = 100 + Math.random() * 180
    sh.life = (sh.maxTrail / sh.spd) * 3
    sh.age = 0
    sh.active = true
  }

  // ── Animation loop ────────────────────────────────────────────────
  let elapsed = 0
  let lastNow = performance.now()
  let rafId = 0
  let intervalId = 0
  let running = true

  function tick(now: number) {
    if (!running) return

    const rawDt = Math.min(now - lastNow, 50)
    const dt = rawDt / 16.67
    lastNow = now
    elapsed += dt

    // Smooth mouse
    mx += (tmx - mx) * 0.05
    my += (tmy - my) * 0.05

    ctx.clearRect(0, 0, W, H)

    // Draw stars
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i]
      // Screen position with parallax
      const sx = s.x * W + mx * s.pFactor
      const sy = s.y * H + my * s.pFactor * 0.5
      // Wrap at edges
      const px = ((sx % W) + W) % W
      const py = ((sy % H) + H) % H
      // Twinkle
      const tw = Math.sin(elapsed * s.freq + s.phase)
      const opa = Math.max(0.05, Math.min(1, s.opa * (1 + tw * s.amp * 0.5)))
      drawStar(s, px, py, opa)
    }

    // Draw shooting stars
    for (let i = 0; i < shooters.length; i++) {
      const sh = shooters[i]
      if (!sh.active) {
        sh.timer += rawDt
        if (sh.timer >= sh.delay) {
          sh.timer = 0
          sh.delay = 1000 + Math.random() * 4500
          spawnShooter(sh)
        }
        continue
      }

      sh.age += dt
      sh.x += sh.vx * dt
      sh.y += sh.vy * dt

      const prog = sh.age / sh.life
      const fadeIn  = Math.min(sh.age / (sh.life * 0.1), 1)
      const fadeOut = prog > 0.7 ? Math.max(0, 1 - (prog - 0.7) / 0.3) : 1
      const opa = fadeIn * fadeOut

      const trailFrac = Math.min(sh.age / (sh.life * 0.3), 1)
      const trail = sh.maxTrail * trailFrac

      if (opa > 0.01 && trail > 2) {
        const tx = sh.x - (sh.vx / sh.spd) * trail
        const ty = sh.y - (sh.vy / sh.spd) * trail

        const g = ctx.createLinearGradient(tx, ty, sh.x, sh.y)
        g.addColorStop(0,    'rgba(255,255,255,0)')
        g.addColorStop(0.4,  `rgba(180,205,255,${(opa * 0.2).toFixed(3)})`)
        g.addColorStop(0.85, `rgba(240,245,255,${(opa * 0.7).toFixed(3)})`)
        g.addColorStop(1,    `rgba(255,255,255,${opa.toFixed(3)})`)

        ctx.save()
        ctx.strokeStyle = g
        ctx.lineWidth = 1.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(sh.x, sh.y)
        ctx.stroke()

        // Head glow
        const hg = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 6)
        hg.addColorStop(0,   `rgba(255,255,255,${opa.toFixed(3)})`)
        hg.addColorStop(0.5, `rgba(200,220,255,${(opa * 0.4).toFixed(3)})`)
        hg.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = hg
        ctx.beginPath()
        ctx.arc(sh.x, sh.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (prog >= 1 || sh.x > W + 300 || sh.y > H + 300) {
        sh.active = false
        sh.timer = 0
        sh.delay = 1000 + Math.random() * 4000
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  // Visibility-aware scheduling:
  // - Use RAF when tab is visible (smooth 60fps)
  // - Fall back to setInterval at ~30fps when hidden (keeps canvas warm, handles devtools)
  function startRAF() {
    clearInterval(intervalId)
    lastNow = performance.now()
    rafId = requestAnimationFrame(tick)
  }

  function startInterval() {
    cancelAnimationFrame(rafId)
    lastNow = performance.now()
    intervalId = window.setInterval(() => {
      if (!running) return
      tick(performance.now())
    }, 33)  // ~30fps fallback
  }

  function onVisibilityChange() {
    if (document.hidden) {
      startInterval()
    } else {
      startRAF()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  // Start whichever is appropriate now
  if (document.hidden) {
    startInterval()
  } else {
    startRAF()
  }

  return () => {
    running = false
    cancelAnimationFrame(rafId)
    clearInterval(intervalId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMouse)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    canvas.remove()
  }
}
