// Static maps so Tailwind's scanner picks up these classes (no dynamic strings).
export const accentBg: Record<string, string> = {
  main: "bg-main",
  "accent-pink": "bg-accent-pink",
  "accent-cyan": "bg-accent-cyan",
  "accent-lime": "bg-accent-lime",
  "accent-purple": "bg-accent-purple",
  "accent-blue": "bg-accent-blue",
}

export const accentText: Record<string, string> = {
  main: "text-main-foreground",
  "accent-pink": "text-foreground",
  "accent-cyan": "text-foreground",
  "accent-lime": "text-foreground",
  "accent-purple": "text-foreground",
  "accent-blue": "text-foreground",
}

export function bgFor(accent: string) {
  return accentBg[accent] ?? "bg-main"
}
