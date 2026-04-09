"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ban,
  ChevronDown,
  History,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  desktopNavControlClass,
  desktopNavRailClass,
} from "@/components/navbar";
import type { ModerationTabValue } from "@/types/moderation";

/** Matches `desktopNavRouteActiveClass` for Radix Tabs `data-[state=active]` */
const tabActiveClass =
  "data-[state=active]:bg-background/95 data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/20 dark:data-[state=active]:bg-background/45 dark:data-[state=active]:ring-primary/30 data-[state=active]:hover:bg-background/95 dark:data-[state=active]:hover:bg-background/45";

const TAB_ITEMS = [
  { value: "overview", label: "Overview", Icon: LayoutDashboard },
  { value: "active", label: "Active Bans", Icon: Ban },
  { value: "recent", label: "Recent Actions", Icon: History },
  { value: "disputes", label: "Disputes", Icon: Shield },
] as const;

interface ModerationTabNavProps {
  activeTab: ModerationTabValue;
  onTabChange: (value: string) => void;
}

export function ModerationTabNav({ activeTab, onTabChange }: ModerationTabNavProps) {
  const currentLabel = TAB_ITEMS.find((t) => t.value === activeTab)?.label ?? "Overview";

  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* Desktop: TabsList */}
      <div className="hidden md:block">
        <TabsList
          className={cn(
            "h-auto w-full min-h-0 justify-start gap-0.5 bg-transparent p-0 text-muted-foreground",
            desktopNavRailClass,
          )}
        >
          {TAB_ITEMS.map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(desktopNavControlClass, tabActiveClass)}
            >
              <Icon className="mr-2 h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between min-h-[44px]">
              {currentLabel}
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(16rem,calc(100vw-2rem))]">
            {TAB_ITEMS.map(({ value, label, Icon }) => (
              <DropdownMenuItem
                key={value}
                className="gap-2"
                onClick={() => onTabChange(value)}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
