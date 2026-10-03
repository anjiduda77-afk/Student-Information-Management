import { useEffect, useRef } from 'react'

/**
 * AntigravityCanvas
 * 5 Photorealistic 3D Floating Spheres with free-roaming Antigravity physics:
 * - Moves randomly and floats across the ENTIRE SCREEN
 * - Reacts to cursor/touch repulsion anywhere on the screen
 * - Softly deflects away from the central login card and logo (never covers inputs)
 * - Soft ball-to-ball elastic collisions
 * - Bounces gently off screen edges
 */
export default function AntigravityCanvas({ isDark = false, cardRef, logoRef }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const updateCanvasSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    updateCanvasSize()

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Pointer state
    const pointer = {
      x: -1000,
      y: -1000,
      active: false,
      vx: 0,
      vy: 0,
      prevX: -1000,
      prevY: -1000
    }

    // 5 Unique 3D Spheres
    // 1: Golden yellow (Aditya University gold)
    // 2: Deep university blue
    // 3: Soft amber (large focal ball)
    // 4: Light silver / white
    // 5: Royal blue with gold rim gradient
    const baseConfigs = [
      {
        id: 1,
        name: 'golden',
        baseRadius: 62,
        mass: 1.2,
        initPos: { rx: 0.15, ry: 0.22 },
        initVel: { vx: 0.5, vy: -0.35 },
        wave: { freqX: 0.0009, freqY: 0.0013, amp: 0.35, phase: 0.4 },
        type: 'gold'
      },
      {
        id: 2,
        name: 'navy-blue',
        baseRadius: 52,
        mass: 0.95,
        initPos: { rx: 0.18, ry: 0.68 },
        initVel: { vx: -0.4, vy: 0.45 },
        wave: { freqX: 0.0014, freqY: 0.0008, amp: 0.3, phase: 1.8 },
        type: 'blue'
      },
      {
        id: 3,
        name: 'amber-large',
        baseRadius: 82,
        mass: 1.55,
        initPos: { rx: 0.84, ry: 0.32 },
        initVel: { vx: -0.45, vy: -0.3 },
        wave: { freqX: 0.0008, freqY: 0.0011, amp: 0.25, phase: 3.2 },
        type: 'amber'
      },
      {
        id: 4,
        name: 'silver-white',
        baseRadius: 42,
        mass: 0.75,
        initPos: { rx: 0.28, ry: 0.85 },
        initVel: { vx: 0.6, vy: 0.4 },
        wave: { freqX: 0.0015, freqY: 0.0016, amp: 0.4, phase: 4.5 },
        type: 'silver'
      },
      {
        id: 5,
        name: 'blue-gold-rim',
        baseRadius: 60,
        mass: 1.1,
        initPos: { rx: 0.82, ry: 0.78 },
        initVel: { vx: 0.35, vy: -0.5 },
        wave: { freqX: 0.0011, freqY: 0.0014, amp: 0.32, phase: 2.7 },
        type: 'blueGold'
      }
    ]

    const getScale = () => {
      if (width < 640) return 0.62
      if (width < 1024) return 0.82
      return 1.0
    }

    let scale = getScale()

    // Initialize physical ball instances
    let balls = baseConfigs.map(cfg => {
      const radius = cfg.baseRadius * scale
      return {
        ...cfg,
        radius,
        x: width * cfg.initPos.rx,
        y: height * cfg.initPos.ry,
        vx: cfg.initVel.vx * (prefersReducedMotion ? 0.3 : 1),
        vy: cfg.initVel.vy * (prefersReducedMotion ? 0.3 : 1),
        tiltX: 0,
        tiltY: 0
      }
    })

    const handleResize = () => {
      updateCanvasSize()
      scale = getScale()
      balls.forEach((ball, idx) => {
        ball.radius = baseConfigs[idx].baseRadius * scale
        // Keep inside bounds
        ball.x = Math.min(Math.max(ball.x, ball.radius), width - ball.radius)
        ball.y = Math.min(Math.max(ball.y, ball.radius), height - ball.radius)
      })
    }

    window.addEventListener('resize', handleResize)

    // Pointer handlers
    const updatePointer = (clientX, clientY) => {
      if (pointer.prevX !== -1000) {
        pointer.vx = clientX - pointer.prevX
        pointer.vy = clientY - pointer.prevY
      }
      pointer.prevX = clientX
      pointer.prevY = clientY
      pointer.x = clientX
      pointer.y = clientY
      pointer.active = true
    }

    const onPointerMove = (e) => {
      updatePointer(e.clientX, e.clientY)
    }

    const onPointerLeave = () => {
      pointer.active = false
      pointer.x = -1000
      pointer.y = -1000
      pointer.prevX = -1000
      pointer.prevY = -1000
    }

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('mouseleave', onPointerLeave, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onPointerLeave, { passive: true })
    window.addEventListener('touchcancel', onPointerLeave, { passive: true })

    // Physics Loop
    let lastTime = performance.now()

    const step = (time) => {
      if (document.hidden) {
        animFrameRef.current = requestAnimationFrame(step)
        return
      }

      const dt = Math.min((time - lastTime) / 1000, 0.045)
      lastTime = time

      // Get obstacle boxes (login card and brand header)
      let cardBox = null
      if (cardRef && cardRef.current) {
        const r = cardRef.current.getBoundingClientRect()
        cardBox = {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          halfW: r.width / 2,
          halfH: r.height / 2
        }
      }

      let logoBox = null
      if (logoRef && logoRef.current) {
        const lr = logoRef.current.getBoundingClientRect()
        logoBox = {
          left: lr.left,
          top: lr.top,
          right: lr.right,
          bottom: lr.bottom,
          cx: lr.left + lr.width / 2,
          cy: lr.top + lr.height / 2
        }
      }

      const pointerRadius = (width < 640 ? 140 : 180) * scale
      const repulsionStrength = (width < 640 ? 950 : 1500) * (prefersReducedMotion ? 0.3 : 1)

      // 1. Update ball motion & forces
      balls.forEach(ball => {
        let fx = 0
        let fy = 0

        // Continuous Antigravity Random Drift
        // Oscillating thrust wave ensures continuous, non-stopping, organic low-gravity movement
        const w = ball.wave
        const tScale = prefersReducedMotion ? 0.4 : 1.0
        const driftFx = Math.sin(time * w.freqX * tScale + w.phase) * w.amp
        const driftFy = Math.cos(time * w.freqY * tScale + w.phase * 1.5) * w.amp
        fx += driftFx
        fy += driftFy

        // Pointer Repulsion (Mouse or Touch across the ENTIRE screen)
        if (pointer.active) {
          const dx = ball.x - pointer.x
          const dy = ball.y - pointer.y
          const dist = Math.hypot(dx, dy)
          const minDist = pointerRadius + ball.radius

          if (dist < minDist && dist > 1) {
            const factor = Math.pow(1 - dist / minDist, 1.5)
            const repForce = factor * (repulsionStrength / ball.mass)
            fx += (dx / dist) * repForce * dt * 60
            fy += (dy / dist) * repForce * dt * 60

            // Add slight impulse from pointer velocity
            if (pointer.vx || pointer.vy) {
              fx += (pointer.vx * 0.08) / ball.mass
              fy += (pointer.vy * 0.08) / ball.mass
            }
          }
        }

        // Deflect away from Login Card (never obscure the login card)
        if (cardBox) {
          const pad = ball.radius + 14
          const nearX = ball.x > cardBox.left - pad && ball.x < cardBox.right + pad
          const nearY = ball.y > cardBox.top - pad && ball.y < cardBox.bottom + pad

          if (nearX && nearY) {
            const cdx = ball.x - cardBox.cx
            const cdy = ball.y - cardBox.cy
            const cdist = Math.hypot(cdx, cdy) || 1
            const push = (120 / ball.mass)
            fx += (cdx / cdist) * push
            fy += (cdy / cdist) * push
          }
        }

        // Deflect away from Brand Logo
        if (logoBox) {
          const lpad = ball.radius + 24
          const nearLX = ball.x > logoBox.left - lpad && ball.x < logoBox.right + lpad
          const nearLY = ball.y > logoBox.top - lpad && ball.y < logoBox.bottom + lpad

          if (nearLX && nearLY) {
            const ldx = ball.x - logoBox.cx
            const ldy = ball.y - logoBox.cy
            const ldist = Math.hypot(ldx, ldy) || 1
            fx += (ldx / ldist) * (110 / ball.mass)
            fy += (ldy / ldist) * (110 / ball.mass)
          }
        }

        // Velocity Integration
        ball.vx += fx * dt * 60
        ball.vy += fy * dt * 60

        // Air damping: light damping when fast, but keep a natural minimum drift speed
        const speed = Math.hypot(ball.vx, ball.vy)
        const maxSpeed = prefersReducedMotion ? 3.5 : 11
        if (speed > maxSpeed) {
          ball.vx = (ball.vx / speed) * maxSpeed
          ball.vy = (ball.vy / speed) * maxSpeed
        } else if (speed > 2.0) {
          // Gently damp high kicks
          ball.vx *= 0.965
          ball.vy *= 0.965
        } else if (speed < 0.45 && !prefersReducedMotion) {
          // Maintain organic continuous floating
          const angle = Math.atan2(ball.vy, ball.vx) || Math.random() * Math.PI * 2
          ball.vx = Math.cos(angle) * 0.55
          ball.vy = Math.sin(angle) * 0.55
        }

        // Position Integration
        ball.x += ball.vx * dt * 60
        ball.y += ball.vy * dt * 60

        // Soft Screen Edge Bounces (across entire viewport)
        const edgePad = ball.radius + 6
        if (ball.x < edgePad) {
          ball.x = edgePad
          ball.vx = Math.abs(ball.vx) * 0.88 + 0.2
        } else if (ball.x > width - edgePad) {
          ball.x = width - edgePad
          ball.vx = -Math.abs(ball.vx) * 0.88 - 0.2
        }

        if (ball.y < edgePad) {
          ball.y = edgePad
          ball.vy = Math.abs(ball.vy) * 0.88 + 0.2
        } else if (ball.y > height - edgePad) {
          ball.y = height - edgePad
          ball.vy = -Math.abs(ball.vy) * 0.88 - 0.2
        }

        // Subtle physical 3D tilt tracking velocity
        ball.tiltX = ball.vx * 0.05
        ball.tiltY = ball.vy * 0.05
      })

      // 2. Ball-to-Ball Soft Elastic Collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i]
          const b2 = balls[j]
          const dx = b2.x - b1.x
          const dy = b2.y - b1.y
          const dist = Math.hypot(dx, dy)
          const minDist = b1.radius + b2.radius

          if (dist < minDist && dist > 0.01) {
            const nx = dx / dist
            const ny = dy / dist
            const overlap = minDist - dist

            const totalMass = b1.mass + b2.mass
            const m1Ratio = b2.mass / totalMass
            const m2Ratio = b1.mass / totalMass

            b1.x -= nx * overlap * m1Ratio
            b1.y -= ny * overlap * m1Ratio
            b2.x += nx * overlap * m2Ratio
            b2.y += ny * overlap * m2Ratio

            const rvx = b2.vx - b1.vx
            const rvy = b2.vy - b1.vy
            const velAlongNormal = rvx * nx + rvy * ny

            if (velAlongNormal < 0) {
              const restitution = 0.82
              const impulse = -(1 + restitution) * velAlongNormal / (1 / b1.mass + 1 / b2.mass)
              b1.vx -= (impulse / b1.mass) * nx
              b1.vy -= (impulse / b1.mass) * ny
              b2.vx += (impulse / b2.mass) * nx
              b2.vy += (impulse / b2.mass) * ny
            }
          }
        }
      }

      // 3. Render Canvas
      ctx.clearRect(0, 0, width, height)

      // Sort by radius for depth
      const sortedBalls = [...balls].sort((a, b) => a.radius - b.radius)
      sortedBalls.forEach(ball => {
        drawRealistic3DSphere(ctx, ball, isDark)
      })

      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseleave', onPointerLeave)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onPointerLeave)
      window.removeEventListener('touchcancel', onPointerLeave)
    }
  }, [isDark, cardRef, logoRef])

  return (
    <canvas
      ref={canvasRef}
      className="antigravity-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  )
}

function drawRealistic3DSphere(ctx, ball, isDark) {
  const { x, y, radius, type, tiltX, tiltY } = ball
  const r = radius

  // Upper-left light source with subtle velocity tilt
  const lx = x - r * 0.34 + (tiltX || 0) * 8
  const ly = y - r * 0.36 + (tiltY || 0) * 8

  ctx.save()

  // 1. Soft Ambient Drop Shadow
  const shadowDist = r * 0.42
  const shadowGrad = ctx.createRadialGradient(
    x + r * 0.22,
    y + shadowDist,
    r * 0.1,
    x + r * 0.22,
    y + shadowDist,
    r * 1.15
  )
  const shadowAlpha = isDark ? 0.32 : 0.16
  shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`)
  shadowGrad.addColorStop(0.5, `rgba(0, 0, 0, ${shadowAlpha * 0.38})`)
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

  ctx.beginPath()
  ctx.ellipse(x + r * 0.16, y + r * 0.32, r * 0.95, r * 0.48, 0, 0, Math.PI * 2)
  ctx.fillStyle = shadowGrad
  ctx.fill()

  // 2. Base Sphere Path
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.closePath()

  // 3. Multi-stop 3D Radial Body Gradient
  const sphereGrad = ctx.createRadialGradient(lx, ly, r * 0.05, x, y, r * 1.05)

  if (type === 'gold') {
    if (isDark) {
      sphereGrad.addColorStop(0, '#fff4cc')
      sphereGrad.addColorStop(0.18, '#ffd466')
      sphereGrad.addColorStop(0.48, '#e5a525')
      sphereGrad.addColorStop(0.78, '#a66e0a')
      sphereGrad.addColorStop(1, '#573703')
    } else {
      sphereGrad.addColorStop(0, '#fffbe8')
      sphereGrad.addColorStop(0.18, '#ffde7a')
      sphereGrad.addColorStop(0.46, '#eeb134')
      sphereGrad.addColorStop(0.78, '#b87c12')
      sphereGrad.addColorStop(1, '#734b07')
    }
  } else if (type === 'blue') {
    if (isDark) {
      sphereGrad.addColorStop(0, '#93c5fd')
      sphereGrad.addColorStop(0.16, '#3b82f6')
      sphereGrad.addColorStop(0.48, '#1d4ed8')
      sphereGrad.addColorStop(0.8, '#1e3a8a')
      sphereGrad.addColorStop(1, '#0b1638')
    } else {
      sphereGrad.addColorStop(0, '#bfdbfe')
      sphereGrad.addColorStop(0.18, '#60a5fa')
      sphereGrad.addColorStop(0.48, '#2563eb')
      sphereGrad.addColorStop(0.8, '#1e40af')
      sphereGrad.addColorStop(1, '#11235e')
    }
  } else if (type === 'amber') {
    if (isDark) {
      sphereGrad.addColorStop(0, '#ffedd5')
      sphereGrad.addColorStop(0.16, '#fba749')
      sphereGrad.addColorStop(0.46, '#d97706')
      sphereGrad.addColorStop(0.78, '#92400e')
      sphereGrad.addColorStop(1, '#451a03')
    } else {
      sphereGrad.addColorStop(0, '#fff7ed')
      sphereGrad.addColorStop(0.18, '#fcc882')
      sphereGrad.addColorStop(0.46, '#e88915')
      sphereGrad.addColorStop(0.78, '#b45309')
      sphereGrad.addColorStop(1, '#662d04')
    }
  } else if (type === 'silver') {
    if (isDark) {
      sphereGrad.addColorStop(0, '#ffffff')
      sphereGrad.addColorStop(0.2, '#e2e8f0')
      sphereGrad.addColorStop(0.5, '#94a3b8')
      sphereGrad.addColorStop(0.82, '#475569')
      sphereGrad.addColorStop(1, '#1e293b')
    } else {
      sphereGrad.addColorStop(0, '#ffffff')
      sphereGrad.addColorStop(0.2, '#f8fafc')
      sphereGrad.addColorStop(0.48, '#cbd5e1')
      sphereGrad.addColorStop(0.8, '#94a3b8')
      sphereGrad.addColorStop(1, '#64748b')
    }
  } else {
    // Blue + subtle gold gradient
    if (isDark) {
      sphereGrad.addColorStop(0, '#fef08a')
      sphereGrad.addColorStop(0.14, '#eab308')
      sphereGrad.addColorStop(0.4, '#2563eb')
      sphereGrad.addColorStop(0.78, '#1e3a8a')
      sphereGrad.addColorStop(1, '#09153a')
    } else {
      sphereGrad.addColorStop(0, '#fef9c3')
      sphereGrad.addColorStop(0.16, '#facc15')
      sphereGrad.addColorStop(0.44, '#3b82f6')
      sphereGrad.addColorStop(0.78, '#1d4ed8')
      sphereGrad.addColorStop(1, '#0e2366')
    }
  }

  ctx.fillStyle = sphereGrad
  ctx.fill()

  // 4. Specular Highlight (Crisp 3D gloss)
  const specGrad = ctx.createRadialGradient(
    lx - r * 0.05,
    ly - r * 0.05,
    0,
    lx,
    ly,
    r * 0.42
  )
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
  specGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)')
  specGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)')
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.beginPath()
  ctx.arc(lx, ly, r * 0.42, 0, Math.PI * 2)
  ctx.fillStyle = specGrad
  ctx.fill()

  // 5. Ambient Rim Reflection
  const rimGrad = ctx.createRadialGradient(
    x + r * 0.5,
    y + r * 0.5,
    r * 0.6,
    x + r * 0.45,
    y + r * 0.45,
    r
  )
  const rimColor = (type === 'gold' || type === 'amber')
    ? 'rgba(255, 240, 180, 0.22)'
    : 'rgba(180, 210, 255, 0.18)'
  rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
  rimGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0)')
  rimGrad.addColorStop(1, rimColor)

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = rimGrad
  ctx.fill()

  // 6. Delicate Outer Glow
  const glowGrad = ctx.createRadialGradient(x, y, r * 0.95, x, y, r * 1.1)
  const glowColor = isDark
    ? (type === 'gold' ? 'rgba(234, 179, 56, 0.12)' : 'rgba(59, 130, 246, 0.12)')
    : (type === 'gold' ? 'rgba(217, 155, 38, 0.08)' : 'rgba(37, 99, 235, 0.06)')
  glowGrad.addColorStop(0, glowColor)
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

  ctx.beginPath()
  ctx.arc(x, y, r * 1.1, 0, Math.PI * 2)
  ctx.fillStyle = glowGrad
  ctx.fill()

  ctx.restore()
}
