import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Sparkles } from "lucide-react"
import { GAME_COLORS, GAME_LABELS, type ProductGame } from "@/types"

const GAMES: { game: ProductGame; blurb: string; scene: string }[] = [
  {
    game: "MAGIC_THE_GATHERING",
    blurb: "Packs, boxes, Commander, and more.",
    scene:
      "from-blue-950 via-slate-950 to-black before:bg-[radial-gradient(circle_at_72%_28%,rgba(34,211,238,0.42),transparent_34%)]",
  },
  {
    game: "POKEMON",
    blurb: "Booster packs, collections, and accessories.",
    scene:
      "from-amber-950 via-slate-950 to-black before:bg-[radial-gradient(circle_at_78%_35%,rgba(250,204,21,0.5),transparent_34%)]",
  },
  {
    game: "ONE_PIECE",
    blurb: "Sealed product for the One Piece Card Game.",
    scene:
      "from-red-950 via-slate-950 to-black before:bg-[radial-gradient(circle_at_76%_32%,rgba(244,63,94,0.48),transparent_34%)]",
  },
  {
    game: "YUGIOH",
    blurb: "Boosters, decks, and sealed Yu-Gi-Oh! product.",
    scene:
      "from-purple-950 via-slate-950 to-black before:bg-[radial-gradient(circle_at_76%_32%,rgba(124,58,237,0.55),transparent_34%)]",
  },
]

export function ShopByGameCards() {
  return (
    <section className="relative overflow-hidden border-b border-surface-border/80 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div
        className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-electric-cyan/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 sm:mb-10 lg:grid-cols-[0.5fr_0.5fr] lg:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-accent-light">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              <span className="text-xs font-bold uppercase tracking-[0.24em]">Browse</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
              Shop by game
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-foreground/55 sm:text-base lg:justify-self-end">
              Jump straight to the games you collect — one catalog, filters for product type, and
              real stock counts.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {GAMES.map(({ game, blurb, scene }) => {
            const accent = GAME_COLORS[game]
            return (
              <li key={game}>
                <Link
                  href={`/shop?game=${game}`}
                  className={`group relative flex min-h-[150px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${scene} p-5 shadow-2xl shadow-black/25 transition-all duration-300 before:absolute before:inset-0 before:opacity-80 before:content-[''] hover:-translate-y-0.5 hover:border-white/20 hover:shadow-accent/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60 focus-visible:outline-offset-2 sm:min-h-[170px]`}
                >
                  {game === "MAGIC_THE_GATHERING" ? (
                    <Image
                      src="/images/Jace MTG New.png"
                      alt=""
                      fill
                      className="-translate-x-24 translate-y-16 scale-[2.05] object-contain object-right-bottom opacity-90 drop-shadow-[0_18px_28px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:-translate-x-24 group-hover:translate-y-16 group-hover:scale-[2.14]"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : null}
                  {game === "POKEMON" ? (
                    <Image
                      src="/images/PIKA.png"
                      alt=""
                      fill
                      className="-scale-x-100 translate-x-24 object-cover object-right opacity-80 saturate-125 transition-transform duration-700 group-hover:translate-x-24 group-hover:scale-105 group-hover:-scale-x-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : null}
                  {game === "ONE_PIECE" ? (
                    <>
                      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-red-500/35 blur-3xl sm:h-44 sm:w-44" aria-hidden />
                      <Image
                        src="/images/Luffy.png"
                        alt=""
                        fill
                        className="-translate-x-32 translate-y-4 scale-150 object-contain object-right-bottom opacity-90 drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)] transition-transform duration-700 group-hover:-translate-x-32 group-hover:translate-y-4 group-hover:scale-[1.58]"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </>
                  ) : null}
                  {game === "YUGIOH" ? (
                    <>
                      <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-purple-500/30 blur-3xl sm:h-48 sm:w-48" aria-hidden />
                      <Image
                        src="/images/YuGiOh (2).png"
                        alt=""
                        fill
                        className="translate-x-3 scale-90 object-cover object-[62%_center] opacity-90 drop-shadow-[0_18px_28px_rgba(0,0,0,0.6)] [mask-image:linear-gradient(to_right,transparent_0%,black_12%,black_88%,transparent_100%)] transition-transform duration-700 group-hover:translate-x-3 group-hover:scale-95"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </>
                  ) : null}
                  <div
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: `linear-gradient(180deg, ${accent} 0%, ${accent}cc 100%)` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/5" aria-hidden />
                  {game === "POKEMON" ? (
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-950/55 via-transparent to-cyan-950/15 mix-blend-multiply" aria-hidden />
                  ) : null}
                  {game === "MAGIC_THE_GATHERING" ? (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/65 via-cyan-950/10 to-slate-950/20 mix-blend-multiply" aria-hidden />
                  ) : null}
                  {game === "ONE_PIECE" ? (
                    <div className="absolute inset-0 bg-gradient-to-l from-red-950/15 via-transparent to-black/20" aria-hidden />
                  ) : null}
                  {game === "YUGIOH" ? (
                    <div className="absolute inset-0 bg-gradient-to-l from-purple-950/20 via-transparent to-black/25" aria-hidden />
                  ) : null}
                  <div className="relative z-10 flex w-full items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-accent-light">
                        {GAME_LABELS[game]}
                      </h3>
                      <p className="mt-1.5 max-w-[17rem] text-sm leading-snug text-foreground/62">{blurb}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-foreground/70 backdrop-blur-sm transition-all duration-300 group-hover:border-accent-light/60 group-hover:bg-accent/25 group-hover:text-white">
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-8 max-w-2xl text-center text-xs leading-relaxed text-foreground/36 sm:text-left">
          Game names and trademarks belong to their respective owners. Chase The Pulls is an
          independent retailer and is not affiliated with Wizards of the Coast, The Pokémon
          Company, Konami, or Bandai.
        </p>
      </div>
    </section>
  )
}
