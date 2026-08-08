import {
  SiDocker,
  SiExpress,
  SiFirebase,
  SiGit,
  SiMongodb,
  SiMysql,
  SiNetlify,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPostman,
  SiPython,
  SiReact,
  SiReactquery,
  SiRedux,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si"
import type { BentoItem, TileItem } from "@/components/StaggeredGrid"
import { projects } from "@/data/story"

/**
 * 18 tiles — exactly one row short of the 21-slot grid, because the middle
 * three slots are taken by the project bento. Every entry is something that
 * appears in real work on this page; the grid is not padded with logos.
 */
export const stackTiles: TileItem[] = [
  { label: "Python", group: "Backend", icon: <SiPython /> },
  { label: "Node.js", group: "Backend", icon: <SiNodedotjs /> },
  { label: "Express", group: "Backend", icon: <SiExpress /> },
  { label: "PostgreSQL", group: "Backend", icon: <SiPostgresql /> },
  { label: "MySQL", group: "Backend", icon: <SiMysql /> },
  { label: "Supabase", group: "Backend", icon: <SiSupabase /> },
  { label: "Firebase", group: "Backend", icon: <SiFirebase /> },
  { label: "MongoDB", group: "Backend", icon: <SiMongodb /> },
  { label: "React", group: "Frontend", icon: <SiReact /> },
  { label: "Next.js", group: "Frontend", icon: <SiNextdotjs /> },
  { label: "TypeScript", group: "Frontend", icon: <SiTypescript /> },
  { label: "Redux", group: "Frontend", icon: <SiRedux /> },
  { label: "React Query", group: "Frontend", icon: <SiReactquery /> },
  { label: "Tailwind", group: "Frontend", icon: <SiTailwindcss /> },
  { label: "Git", group: "Tools", icon: <SiGit /> },
  { label: "Postman", group: "Tools", icon: <SiPostman /> },
  { label: "Docker", group: "Tools", icon: <SiDocker /> },
  { label: "Netlify", group: "Tools", icon: <SiNetlify /> },
]

/** The centre of the grid: the three things the stack above actually built. */
export const stackBento: BentoItem[] = projects.map((p) => ({
  id: p.id,
  title: p.name,
  subtitle: p.kind,
  description: p.line,
  image: p.shots[0]?.src,
  icon: <span className="label">{p.index}</span>,
}))

/** Everything in the toolkit that has no logo in the grid above. */
export const stackAlsoUsing = [
  "REST API design",
  "HTML / CSS",
  "Bootstrap",
  "CI/CD",
  "AWS (basics)",
  "HTTP & client–server",
  "OOP",
  "Data structures & algorithms",
  "Microservices",
  "Scalable system design",
]
