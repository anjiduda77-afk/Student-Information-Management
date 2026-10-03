import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

/**
 * AmbientBackground
 * Renders 2-3 very soft, slow-moving ambient orbs in the background of internal dashboard pages.
 * Stays strictly behind content (pointer-events: none, z-index: 0, subtle opacity).
 */
export default function AmbientBackground() {
  const canvasRef = useRef(null)
  const { isDark } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let animId = null

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const orbs = [
      {
        rx: 0.12,
        ry: 0.25,
        r: 140,
        color: isDark ? 'rgba(234, 179, 56, 0.045)' : 'rgba(217, 155, 38, 0.05)',
        speedX: 0.0006,
        speedY: 0.0008,
        phase: 0
      },
      {
        rx: 0.88,
        ry: 0.35,
        r: 180,
        color: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(30, 58, 138, 0.04)',
        speedX: 0.0007,
        speedY: 0.0005,
        phase: 1.8
      },
      {
        rx: 0.5,
        ry: 0.82,
        r: 120,
        color: isDark ? 'rgba(148, 163, 184, 0.035)' : 'rgba(245, 158, 11, 0.035)',
        speedX: 0.0005,
        speedY: 0.0007,
        phase: 3.2
      }
    ]

    const render = (time) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render)
        return
      }

      ctx.clearRect(0, 0, width, height)

      orbs.forEach(orb => {
        const x = width * orb.rx + Math.sin(time * orb.speedX + orb.phase) * 45
        const y = height * orb.ry + Math.cos(time * orb.speedY + orb.phase) * 35

        const grad = ctx.createRadialGradient(x, y, 0, x, y, orb.r)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(x, y, orb.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isDark])

  return (
    <canvas
      ref={canvasRef}
      className="ambient-bg-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  )
}
