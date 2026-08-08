import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

const W = 900
const H = 260

const SOURCE = ["wp_posts", "wp_postmeta", "wpl_properties", "wp_users"]
const TARGET = ["properties", "agents", "listings", "auth.users"]

/**
 * The migration, drawn. Source tables on the left, the pipeline in the middle,
 * typed Postgres tables on the right — and the connecting paths draw themselves
 * from scroll position, so the diagram is built while you read the chapter
 * rather than sitting there finished.
 */
export function MigrationDiagram() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.55"],
  })

  const draw = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const flowX = useTransform(scrollYProgress, [0.2, 1], [-140, 140])
  const flowOpacity = useTransform(scrollYProgress, [0.15, 0.3, 0.9, 1], [0, 1, 1, 0])

  const rowY = (i: number) => 46 + i * 56

  return (
    <div ref={ref} className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label="Migration diagram: WordPress and WPL tables pass through a Python pipeline into typed Supabase Postgres tables, including WordPress users into Supabase Auth."
      >
        <defs>
          <linearGradient id="mdWire" x1="0" x2="1">
            <stop offset="0%" stopColor="#b98a33" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#e8b75c" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7c7bff" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* column headings */}
        <text x="14" y="20" className="label" fill="#6c667e" fontSize="10" letterSpacing="2">
          WORDPRESS / WPL
        </text>
        <text x={W / 2 - 42} y="20" fill="#e8b75c" fontSize="10" letterSpacing="2">
          PIPELINE
        </text>
        <text x={W - 150} y="20" fill="#6c667e" fontSize="10" letterSpacing="2">
          SUPABASE / POSTGRES
        </text>

        {/* wires */}
        {SOURCE.map((_, i) => {
          const y1 = rowY(i)
          const y2 = rowY(i)
          const d = `M 172 ${y1} C 300 ${y1}, 330 ${H / 2}, ${W / 2} ${H / 2} C ${W / 2 + 70} ${H / 2}, 600 ${y2}, ${W - 176} ${y2}`
          return (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="url(#mdWire)"
              strokeWidth="1.25"
              pathLength={1}
              style={reduced ? undefined : { strokeDasharray: 1, strokeDashoffset: draw }}
            />
          )
        })}

        {/* travelling packets — the rows in transit */}
        {!reduced &&
          SOURCE.map((_, i) => (
            <motion.circle
              key={`p-${i}`}
              cx={W / 2}
              cy={H / 2}
              r="2.6"
              fill="#ffd489"
              style={{ x: flowX, opacity: flowOpacity }}
            />
          ))}

        {/* source tables */}
        {SOURCE.map((t, i) => (
          <g key={t}>
            <rect
              x="14"
              y={rowY(i) - 15}
              width="158"
              height="30"
              fill="#151223"
              stroke="rgb(184 174 224 / 0.16)"
            />
            <text x="26" y={rowY(i) + 4} fill="#a29cb8" fontSize="12" fontFamily="monospace">
              {t}
            </text>
          </g>
        ))}

        {/* pipeline node */}
        <g>
          <rect
            x={W / 2 - 62}
            y={H / 2 - 24}
            width="124"
            height="48"
            fill="#0d0b14"
            stroke="rgb(232 183 92 / 0.45)"
          />
          <text
            x={W / 2}
            y={H / 2 - 2}
            fill="#e8b75c"
            fontSize="11"
            fontFamily="monospace"
            textAnchor="middle"
          >
            python
          </text>
          <text
            x={W / 2}
            y={H / 2 + 13}
            fill="#6c667e"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="middle"
          >
            batched · re-runnable
          </text>
        </g>

        {/* target tables */}
        {TARGET.map((t, i) => (
          <g key={t}>
            <rect
              x={W - 176}
              y={rowY(i) - 15}
              width="162"
              height="30"
              fill="#151223"
              stroke="rgb(184 174 224 / 0.16)"
            />
            <text
              x={W - 164}
              y={rowY(i) + 4}
              fill={t === "auth.users" ? "#4ed2a8" : "#a29cb8"}
              fontSize="12"
              fontFamily="monospace"
            >
              {t}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
