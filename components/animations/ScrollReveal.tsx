"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none" | "scale"
  duration?: number
}

const EASING = [0.22, 1, 0.36, 1] as const

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.65,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const hidden = {
    opacity: 0,
    y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
    x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
    scale: direction === "scale" ? 0.92 : 1,
  }

  const visible = {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
  }

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={isInView ? visible : hidden}
      transition={{ duration, delay, ease: EASING }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  delayStart = 0,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  delayStart?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayStart,
          },
        },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  direction = "up",
}: {
  children: React.ReactNode
  className?: string
  direction?: "up" | "left" | "right" | "scale"
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          y: direction === "up" ? 35 : 0,
          x: direction === "left" ? 35 : direction === "right" ? -35 : 0,
          scale: direction === "scale" ? 0.9 : 1,
        },
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          transition: { duration: 0.5, ease: EASING },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Fade in with a glowing pulse on first reveal */
export function GlowReveal({
  children,
  className,
  color = "rgba(99, 102, 241, 0.28)",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  color?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={
        isInView
          ? {
              opacity: 1,
              filter: "blur(0px)",
              boxShadow: [
                `0 0 0px ${color}`,
                `0 0 40px ${color}`,
                `0 0 0px ${color}`,
              ],
            }
          : { opacity: 0, filter: "blur(8px)" }
      }
      transition={{
        opacity: { duration: 0.6, delay, ease: EASING },
        filter: { duration: 0.6, delay, ease: "easeOut" },
        boxShadow: { duration: 1.5, delay: delay + 0.3, ease: "easeOut" },
      }}
    >
      {children}
    </motion.div>
  )
}
