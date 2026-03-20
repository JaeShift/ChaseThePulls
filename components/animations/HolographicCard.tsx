"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
}

const HOLO_COLORS = [
  "#ff0080",
  "#ff8c00",
  "#ffd700",
  "#00ff80",
  "#00d4ff",
  "#8b5cf6",
]

let sparkleId = 0

interface HolographicCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  disabled?: boolean
}

export function HolographicCard({
  children,
  className,
  intensity = 1,
  disabled = false,
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const [holographicStyle, setHolographicStyle] = useState<React.CSSProperties>({ opacity: 0 })
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({})
  const [shineStyle, setShineStyle] = useState<React.CSSProperties>({ opacity: 0 })
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const sparkleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isHovering = useRef(false)

  const addSparkle = useCallback((x: number, y: number) => {
    const newSparkle: Sparkle = {
      id: ++sparkleId,
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 60,
      size: Math.random() * 6 + 3,
      color: HOLO_COLORS[Math.floor(Math.random() * HOLO_COLORS.length)],
      duration: Math.random() * 600 + 400,
    }
    setSparkles((prev) => [...prev.slice(-8), newSparkle])
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id))
    }, newSparkle.duration)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || disabled) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * 12 * intensity
      const rotateY = (-(x - centerX) / centerX) * 12 * intensity
      const glareX = (x / rect.width) * 100
      const glareY = (y / rect.height) * 100
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI)

      setTransform(
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`
      )

      setHolographicStyle({
        opacity: 0.45,
        background: `
          radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.3) 0%, transparent 40%),
          linear-gradient(
            ${angle + 135}deg,
            rgba(255, 0, 128, 0.5) 0%,
            rgba(255, 140, 0, 0.45) 14%,
            rgba(255, 215, 0, 0.5) 28%,
            rgba(0, 255, 128, 0.4) 43%,
            rgba(0, 212, 255, 0.45) 57%,
            rgba(139, 92, 246, 0.5) 71%,
            rgba(255, 0, 128, 0.45) 85%,
            rgba(255, 140, 0, 0.5) 100%
          )
        `,
        backgroundSize: "100% 100%, 200% 200%",
      })

      setShineStyle({
        opacity: 0.15,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`,
      })

      setGlowStyle({
        boxShadow: `
          0 0 ${30 + Math.abs(rotateY) * 3}px rgba(255, 215, 0, 0.2),
          0 ${20 + rotateX * 0.5}px ${60 + Math.abs(rotateX) * 2}px rgba(0, 0, 0, 0.7),
          inset 0 1px 0 rgba(255, 255, 255, 0.15)
        `,
      })

      // Occasional sparkles on move
      if (Math.random() < 0.15) {
        addSparkle(x, y)
      }
    },
    [disabled, intensity, addSparkle]
  )

  const startSparkleInterval = useCallback(() => {
    if (!isHovering.current) return
    sparkleTimerRef.current = setInterval(() => {
      if (!cardRef.current || !isHovering.current) return
      const rect = cardRef.current.getBoundingClientRect()
      addSparkle(
        Math.random() * rect.width,
        Math.random() * rect.height
      )
    }, 300)
  }, [addSparkle])

  const handleMouseEnter = useCallback(() => {
    isHovering.current = true
    startSparkleInterval()
  }, [startSparkleInterval])

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false
    if (sparkleTimerRef.current) {
      clearInterval(sparkleTimerRef.current)
    }
    setTransform("")
    setHolographicStyle({ opacity: 0 })
    setGlowStyle({})
    setShineStyle({ opacity: 0 })
  }, [])

  useEffect(() => {
    return () => {
      if (sparkleTimerRef.current) clearInterval(sparkleTimerRef.current)
    }
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className={cn("relative", className)}
      style={{
        transform,
        transformStyle: "preserve-3d",
        transition: "transform 0.12s ease, box-shadow 0.3s ease",
        ...glowStyle,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Holographic rainbow overlay */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
        style={{
          ...holographicStyle,
          mixBlendMode: "overlay",
          zIndex: 10,
        }}
      />

      {/* Shine glare */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          ...shineStyle,
          mixBlendMode: "screen",
          zIndex: 11,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Prismatic edge */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)",
          zIndex: 9,
        }}
      />

      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <SparkleElement key={sparkle.id} sparkle={sparkle} />
      ))}
    </motion.div>
  )
}

function SparkleElement({ sparkle }: { sparkle: Sparkle }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1, rotate: 0 }}
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: 180 }}
      transition={{ duration: sparkle.duration / 1000, ease: "easeOut" }}
      className="absolute pointer-events-none"
      style={{
        left: sparkle.x - sparkle.size / 2,
        top: sparkle.y - sparkle.size / 2,
        zIndex: 20,
      }}
    >
      {/* 4-pointed star shape */}
      <svg
        width={sparkle.size * 2}
        height={sparkle.size * 2}
        viewBox="0 0 24 24"
        fill={sparkle.color}
        style={{ filter: `drop-shadow(0 0 4px ${sparkle.color})` }}
      >
        <path d="M12 2 L13.5 10 L22 12 L13.5 14 L12 22 L10.5 14 L2 12 L10.5 10 Z" />
      </svg>
    </motion.div>
  )
}
