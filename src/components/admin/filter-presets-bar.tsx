"use client"

import { Bookmark, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { type FilterPreset, useFilterPresets } from "@/stores/filter-presets"

// Compact preset bar: lists saved presets (click to apply, hover-X to delete)
// plus a "Simpan" button that snapshots the current filter values. Pair with
// `useFilterState` — presets persist across sessions; URL carries the live view.

// Stable empty array so the zustand selector never returns a fresh [] (which
// would trip useSyncExternalStore's "getServerSnapshot should be cached" /
// max-update-depth loop when the module has no presets yet).
const EMPTY: FilterPreset[] = []

export function FilterPresetsBar({
  module,
  current,
  onApply,
}: {
  module: string
  current: Record<string, string>
  onApply: (snapshot: Record<string, string>) => void
}) {
  const presets = useFilterPresets((s) => s.presets[module]) ?? EMPTY
  const savePreset = useFilterPresets((s) => s.savePreset)
  const deletePreset = useFilterPresets((s) => s.deletePreset)

  function save() {
    const name = window.prompt("Nama preset filter?")
    if (!name) return
    const snapshot = Object.fromEntries(Object.entries(current).filter(([, v]) => Boolean(v)))
    savePreset(module, name.trim(), snapshot)
    toast.success(`Preset "${name.trim()}" disimpan.`)
  }

  function apply(snapshot: Record<string, string>, name: string) {
    onApply(snapshot)
    toast.success(`Preset "${name}" diterapkan.`)
  }

  function remove(id: string, name: string) {
    deletePreset(module, id)
    toast.success(`Preset "${name}" dihapus.`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase text-foreground/45">
        <Bookmark className="size-3.5" /> Preset
      </span>
      {presets.map((preset) => (
        <span
          key={preset.id}
          className="group inline-flex items-center gap-1 rounded-base border-2 border-border bg-secondary-background pl-2 pr-1 py-1 text-xs font-bold shadow-shadow-sm"
        >
          <button
            type="button"
            className="text-left hover:underline"
            onClick={() => apply(preset.value, preset.name)}
          >
            {preset.name}
          </button>
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded-base border-2 border-transparent text-foreground/50 hover:border-border hover:bg-main hover:text-main-foreground"
            onClick={() => remove(preset.id, preset.name)}
            aria-label={`Hapus preset ${preset.name}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Button size="sm" variant="ghost" onClick={save} className="h-8 px-2">
        <Save className="size-3.5" /> Simpan
      </Button>
    </div>
  )
}
