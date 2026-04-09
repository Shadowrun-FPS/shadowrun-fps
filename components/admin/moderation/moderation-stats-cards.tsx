"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationStatsCardsProps {
  loading: boolean;
  warnings: number;
  activeBans: number;
  totalActions: number;
}

interface StatCardProps {
  title: string;
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
  borderHoverClass: string;
  Icon: React.ElementType;
}

function StatCard({
  title,
  value,
  label,
  colorClass,
  bgClass,
  borderHoverClass,
  Icon,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20",
        borderHoverClass,
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2",
          bgClass,
        )}
      />
      <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
        <CardTitle className="text-sm sm:text-base font-medium text-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", bgClass)}>
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClass)} />
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
        <div className={cn("text-xl sm:text-2xl md:text-3xl font-bold", colorClass)}>
          {value}
        </div>
        <p className={cn("text-xs sm:text-sm mt-1", value > 0 ? colorClass : "text-muted-foreground")}>
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

export function ModerationStatsCards({
  loading,
  warnings,
  activeBans,
  totalActions,
}: ModerationStatsCardsProps) {
  if (loading) {
    return (
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="hidden gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      <StatCard
        title="Warnings issued"
        value={warnings}
        label={warnings === 1 ? "1 warn action logged" : `${warnings} warn actions logged`}
        colorClass="text-amber-600 dark:text-amber-400"
        bgClass="bg-amber-500/10"
        borderHoverClass="hover:border-amber-500/50"
        Icon={AlertTriangle}
      />
      <StatCard
        title="Active Bans"
        value={activeBans}
        label={`${activeBans} active bans`}
        colorClass="text-red-600 dark:text-red-400"
        bgClass="bg-red-500/10"
        borderHoverClass="hover:border-red-500/50"
        Icon={Ban}
      />
      <StatCard
        title="Total Actions"
        value={totalActions}
        label={`${totalActions} total actions`}
        colorClass="text-blue-600 dark:text-blue-400"
        bgClass="bg-blue-500/10"
        borderHoverClass="hover:border-blue-500/50"
        Icon={Activity}
      />
    </div>
  );
}
