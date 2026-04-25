"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface PackRevealProps {
  active: boolean
  color?: string
}

const BURST_COLORS = ["#6366F1", "#00D4FF", "#8B5CF6", "#10B981", "#EC4899", "#818CF8"]

interface Particle {
  angle: number
  distance: number
  size: number
  color: string
  delay: number
}

function createBurstParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * 360 + Math.random() * 20 - 10,
    distance: 40 + Math.random() * 50,
    size: Math.random() * 6 + 3,
    color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
    delay: Math.random() * 0.05,
  }))
}

export function PackReveal({ active, color = "#6366F1" }: PackRevealProps) {
  const particles = useRef(createBurstParticles(16))

  useEffect(() => {
    if (active) {
      particles.current = createBurstParticles(16)
    }
  }, [active])

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-50 flex items-center justify-center">
          {/* Ripple rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full border-2"
              style={{ borderColor: color + "80" }}
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ width: 120 + i * 30, height: 120 + i * 30, opacity: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            />
          ))}

          {/* Center flash */}
          <motion.div
            className="absolute rounded-full"
            style={{ background: `radial-gradient(circle, ${color}90 0%, transparent 70%)` }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 80, height: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />

          {/* Burst particles */}
          {particles.current.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180
            const endX = Math.cos(rad) * p.distance
            const endY = Math.sin(rad) * p.distance

            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: endX,
                  y: endY,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.2,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            )
          })}

          {/* Star sparkles */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * 360
            const rad = (angle * Math.PI) / 180
            const dist = 30 + Math.random() * 20

            return (
              <motion.svg
                key={`star-${i}`}
                className="absolute"
                width={10}
                height={10}
                viewBox="0 0 24 24"
                fill={BURST_COLORS[i % BURST_COLORS.length]}
                style={{
                  filter: `drop-shadow(0 0 4px ${BURST_COLORS[i % BURST_COLORS.length]})`,
                }}
                initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0 }}
                animate={{
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  scale: [0, 1.5, 0],
                  rotate: 180,
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.6, delay: 0.05 + i * 0.05, ease: "easeOut" }}
              >
                <path d="M12 2 L13.5 10 L22 12 L13.5 14 L12 22 L10.5 14 L2 12 L10.5 10 Z" />
              </motion.svg>
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}


