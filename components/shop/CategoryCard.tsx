"use client"

import Link from "next/link"

interface CategoryCardProps {
  href: string
  color: string
  bg: string
  icon: string
  label: string
  desc: string
}

export function CategoryCard({ href, color, bg, icon, label, desc }: CategoryCardProps) {
  return (
    <Link href={href}>
      <div
        className="group relative rounded-2xl p-6 border transition-all duration-300 overflow-hidden cursor-pointer"
        style={{ borderColor: `${color}20`, background: bg }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${color}50`
          e.currentTarget.style.boxShadow = `0 0 30px ${color}15, 0 20px 40px rgba(0,0,0,0.3)`
          e.currentTarget.style.transform = "translateY(-4px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${color}20`
          e.currentTarget.style.boxShadow = ""
          e.currentTarget.style.transform = ""
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}15 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10">
          <span className="text-4xl mb-3 block">{icon}</span>
          <h3
            className="font-display font-bold text-lg mb-1 transition-colors duration-200"
            style={{ color }}
          >
            {label}
          </h3>
          <p className="text-foreground/40 text-sm">{desc}</p>
        </div>
      </div>
    </Link>
  )
}

