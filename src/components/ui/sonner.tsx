"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-base !border-2 !border-border !bg-secondary-background !text-foreground !shadow-shadow !font-base",
          title: "!font-heading !font-bold",
          description: "!text-foreground/70",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
