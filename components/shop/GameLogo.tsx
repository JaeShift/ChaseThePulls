"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { GAME_LOGO_BALANCE, GAME_LOGO_SRC, type ProductGame } from "@/types"

type GameLogoProps = {
  game: ProductGame
  className?: string
  /** Fixed box height, e.g. h-5 */
  heightClassName?: string
  /** Fixed box width cap, e.g. w-16 */
  widthClassName?: string
  /** 1 = default; if omitted, uses `GAME_LOGO_BALANCE[game]`. */
  balance?: number
  sizes?: string
  priority?: boolean
}

export function GameLogo({
  game,
  className,
  heightClassName = "h-5",
  widthClassName = "w-16",
  balance,
  sizes = "120px",
  priority,
}: GameLogoProps) {
  const s = balance ?? GAME_LOGO_BALANCE[game]
  return (
    <div
      className={cn("relative flex-shrink-0 origin-center", heightClassName, widthClassName, className)}
      style={s !== 1 ? { transform: `scale(${s})` } : undefined}
    >
      <Image
        src={GAME_LOGO_SRC[game]}
        alt=""
        fill
        sizes={sizes}
        className="object-contain object-center"
        priority={priority}
      />
    </div>
  )
}
