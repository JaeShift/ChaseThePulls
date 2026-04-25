"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  opacity: number
  life: number
  maxLife: number
  type: "orb" | "star" | "diamond"
}

const COLORS = [
  "#6366F1",
  "#6366F1",
  "#00D4FF", // Cyan
  "#8B5CF6", // Purple
  "#FF3B3B", // Red
  "#10B981", // Green
  "#EC4899", // Pink
  "#FF8C00", // Orange
]

/** Lower = slower, calmer motion (1 = original feel) */
const SPEED_FACTOR = 0.2
const SIN_DRIFT = 0.0055
const DRIFT_AMP = 0.18

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const mouseRef = useRef({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", handleMouseMove)

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 20,
      size: Math.random() * 5 + 1.5,
      speedX: (Math.random() - 0.5) * 1.2 * SPEED_FACTOR,
      speedY: -(Math.random() * 1.8 + 0.4) * SPEED_FACTOR,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0,
      life: 0,
      maxLife: (Math.random() * 220 + 120) * 1.65,
      type: Math.random() < 0.6 ? "orb" : Math.random() < 0.5 ? "star" : "diamond",
    })

    // Initialize scattered particles
    for (let i = 0; i < 35; i++) {
      const p = createParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particlesRef.current.push(p)
    }

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.globalAlpha = opacity * 0.9
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = size * 3
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2
        const outerX = Math.cos(angle) * size
        const outerY = Math.sin(angle) * size
        const innerX = Math.cos(angle + Math.PI / 4) * (size * 0.35)
        const innerY = Math.sin(angle + Math.PI / 4) * (size * 0.35)
        if (i === 0) {
          ctx.moveTo(outerX, outerY)
        } else {
          ctx.lineTo(outerX, outerY)
        }
        ctx.lineTo(innerX, innerY)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, color: string) => {
      ctx.save()
      ctx.globalAlpha = opacity * 0.85
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = size * 2
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x + size * 0.6, y)
      ctx.lineTo(x, y + size)
      ctx.lineTo(x - size * 0.6, y)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    let isActive = true

    const animate = () => {
      if (!isActive) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add new particles occasionally
      if (Math.random() < 0.065 && particlesRef.current.length < 65) {
        particlesRef.current.push(createParticle())
      }

      // Occasionally spawn near mouse
      if (Math.random() < 0.016 && mouseRef.current.x > 0) {
        const p = createParticle()
        p.x = mouseRef.current.x + (Math.random() - 0.5) * 100
        p.y = mouseRef.current.y + (Math.random() - 0.5) * 100
        p.maxLife = 60 + Math.random() * 60
        p.size = Math.random() * 3 + 1
        particlesRef.current.push(p)
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++
        const lifeRatio = p.life / p.maxLife

        if (lifeRatio < 0.12) {
          p.opacity = lifeRatio * (1 / 0.12)
        } else if (lifeRatio > 0.75) {
          p.opacity = (1 - lifeRatio) * (1 / 0.25)
        } else {
          p.opacity = 0.85
        }

        // Gentle mouse repulsion
        const dx = p.x - mouseRef.current.x
        const dy = p.y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120 && dist > 0) {
          const force = ((120 - dist) / 120) * 0.22 * SPEED_FACTOR
          p.speedX += (dx / dist) * force
          p.speedY += (dy / dist) * force
          // Dampen speed to prevent runaway
          const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY)
          const maxSpeed = 0.75
          if (speed > maxSpeed) {
            p.speedX = (p.speedX / speed) * maxSpeed
            p.speedY = (p.speedY / speed) * maxSpeed
          }
        }

        p.x += p.speedX + Math.sin(p.life * SIN_DRIFT + p.size) * DRIFT_AMP * SPEED_FACTOR
        p.y += p.speedY

        // Gradually restore natural drift
        p.speedX *= 0.985
        p.speedY =
          p.speedY * 0.995 - 0.18 * SPEED_FACTOR * (1 - Math.abs(p.speedY) / 5)

        if (p.type === "orb") {
          // Glow orb
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
          const hexOpacity = Math.min(255, Math.max(0, Math.round(p.opacity * 255))).toString(16).padStart(2, "0")
          const hexOpacityLow = Math.min(255, Math.max(0, Math.round(p.opacity * 0.25 * 255))).toString(16).padStart(2, "0")
          gradient.addColorStop(0, p.color + hexOpacity)
          gradient.addColorStop(0.4, p.color + hexOpacityLow)
          gradient.addColorStop(1, p.color + "00")

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()

          // Bright core
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`
          ctx.fill()
        } else if (p.type === "star") {
          drawStar(ctx, p.x, p.y, p.size * 1.2, p.opacity, p.color)
        } else {
          drawDiamond(ctx, p.x, p.y, p.size, p.opacity, p.color)
        }

        return p.life < p.maxLife && p.y > -80
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      isActive = false
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.22 }}
    />
  )
}
