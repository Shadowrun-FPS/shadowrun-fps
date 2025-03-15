"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Shield, Users, FileText, Book, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      href: "/admin/players",
      icon: Users,
      label: "Players",
    },
    {
      href: "/admin/moderation",
      icon: Shield,
      label: "Moderation",
    },
    {
      href: "/admin/logs",
      icon: FileText,
      label: "Logs",
    },
    {
      href: "/admin/rules",
      icon: Book,
      label: "Rules",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 p-0">
        <div className="font-bold text-xl mb-8 px-4 pt-8 flex items-center gap-2 text-white">
          <Shield className="h-6 w-6 text-indigo-400" />
          <span>Mod Panel</span>
        </div>
        <nav className="space-y-1 px-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                pathname === route.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white",
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

