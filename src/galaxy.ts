/**
 * galaxy.ts — Immersive warp-speed space background.
 * Stars zoom outward from center using 3D projection, creating the feel
 * of flying through a galaxy. Runs outside React to avoid StrictMode.
 */

export function initGalaxy(): () => void {
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

  // ── Mouse parallax (shifts perspective vanishing point) ───────────
  let mx = 0, my = 0, tmx = 0, tmy = 0
  const onMouse = (e: MouseEvent) => {
    tmx = (e.clientX / W - 0.5) * 2
    tmy = (e.clientY / H - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouse)

  // ── 3D warp star system ───────────────────────────────────────────
  const FOV       = 300   // perspective (higher = wider field)
  const MAX_Z     = 900   // max depth
  const WARP_SPD  = 0.5   // z-units consumed per 60fps frame

  const COLORS = ['#ffffff','#ffffff','#ffffff','#e8f0ff','#fff4e0','#ffe4e4','#e4fff0','#ede4ff']

  type Star3D = {
    ox: number    // x offset from center (world space)
    oy: number    // y offset from center (world space)
    z: number     // depth (large = far)
    r: number     // base radius
    color: string
    bright: boolean
    spd: number   // per-star speed variation
  }

  function newStar(): Star3D {
    const angle = Math.random() * Math.PI * 2
    const dist  = 25 + Math.random() * 520
    return {
      ox:     Math.cos(angle) * dist,
      oy:     Math.sin(angle) * dist * 0.65,
      z:      10 + Math.random() * MAX_Z,
      r:      0.5 + Math.random() * 2.4,
      color:  COLORS[Math.floor(Math.random() * COLORS.length)],
      bright: Math.random() < 0.07,
      spd:    0.55 + Math.random() * 0.9,
    }
  }

  function resetStar(s: Star3D) {
    const angle = Math.random() * Math.PI * 2
    const dist  = 25 + Math.random() * 520
    s.ox     = Math.cos(angle) * dist
    s.oy     = Math.sin(angle) * dist * 0.65
    s.z      = MAX_Z * 0.55 + Math.random() * MAX_Z * 0.45
    s.bright = Math.random() < 0.07
    s.spd    = 0.55 + Math.random() * 0.9
  }

  // Spread initial z values so the field looks full from the first frame
  const stars: Star3D[] = Array.from({ length: 680 }, () => {
    const s = newStar()
    s.z = Math.random() * MAX_Z
    return s
  })

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
    timer: i * 900,
    delay: 1400 + Math.random() * 3600,
  }))

  function spawnShooter(sh: Shooter) {
    const ang = (18 + Math.random() * 44) * Math.PI / 180
    sh.spd     = 10 + Math.random() * 14
    sh.x       = Math.random() < 0.6 ? Math.random() * W : -20
    sh.y       = Math.random() < 0.6 ? -20 : Math.random() * H * 0.5
    sh.vx      = Math.cos(ang) * sh.spd
    sh.vy      = Math.sin(ang) * sh.spd
    sh.maxTrail = 100 + Math.random() * 190
    sh.life    = (sh.maxTrail / sh.spd) * 3
    sh.age     = 0
    sh.active  = true
  }

  // ── Animation loop ────────────────────────────────────────────────
  let elapsed = 0
  let lastNow = performance.now()
  let rafId = 0, intervalId = 0, running = true

  function tick(now: number) {
    if (!running) return

    const rawDt = Math.min(now - lastNow, 50)
    const dt    = rawDt / 16.67
    lastNow     = now
    elapsed    += dt

    // Smooth mouse
    mx += (tmx - mx) * 0.045
    my += (tmy - my) * 0.045

    ctx.clearRect(0, 0, W, H)

    // Vanishing point shifts slightly with mouse
    const cx = W * 0.5 + mx * 38
    const cy = H * 0.5 + my * 20

    // Draw 3D warp stars
    for (const s of stars) {
      s.z -= WARP_SPD * dt * s.spd

      const scale = FOV / Math.max(s.z, 0.5)
      const px    = s.ox * scale + cx
      const py    = s.oy * scale + cy

      if (s.z <= 1 || px < -100 || px > W + 100 || py < -100 || py > H + 100) {
        resetStar(s)
        continue
      }

      const r = Math.max(0.25, s.r * scale * 0.3)

      // Fade in as star emerges from far depths; fade out as it passes close
      const farFade  = Math.min(1, (MAX_Z - s.z) / (MAX_Z * 0.55))
      const nearFade = Math.min(1, s.z / 60)
      const opa      = farFade * nearFade

      if (opa < 0.025 || r < 0.2) continue

      ctx.save()
      ctx.globalAlpha = opa

      if (s.bright && r > 1.2) {
        const g = ctx.createRadialGradient(px, py, 0, px, py, r * 5)
        g.addColorStop(0,   `rgba(255,255,255,${(opa * 0.55).toFixed(3)})`)
        g.addColorStop(0.4, `rgba(180,210,255,${(opa * 0.15).toFixed(3)})`)
        g.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, r * 5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = s.color
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
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
      sh.x   += sh.vx * dt
      sh.y   += sh.vy * dt

      const prog    = sh.age / sh.life
      const fadeIn  = Math.min(sh.age / (sh.life * 0.1), 1)
      const fadeOut = prog > 0.7 ? Math.max(0, 1 - (prog - 0.7) / 0.3) : 1
      const opa     = fadeIn * fadeOut

      const trailFrac = Math.min(sh.age / (sh.life * 0.3), 1)
      const trail     = sh.maxTrail * trailFrac

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
        ctx.lineCap   = 'round'
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(sh.x, sh.y)
        ctx.stroke()

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
        sh.timer  = 0
        sh.delay  = 1000 + Math.random() * 4000
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function startRAF() {
    clearInterval(intervalId)
    lastNow = performance.now()
    rafId   = requestAnimationFrame(tick)
  }

  function startInterval() {
    cancelAnimationFrame(rafId)
    lastNow    = performance.now()
    intervalId = window.setInterval(() => {
      if (!running) return
      tick(performance.now())
    }, 33)
  }

  function onVisibilityChange() {
    if (document.hidden) startInterval()
    else startRAF()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  if (document.hidden) startInterval()
  else startRAF()

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
