"use client";

import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueueCard } from "@/components/queues/queue-card";
import { QUEUE_SIZES, getQueueSections, formatJoinTime, isPlayerInQueue, tabLabelToTeamSize } from "@/lib/queue-utils";
import type { RuntimeQueue, AdminQueueRecord } from "@/types/admin-queue";

interface QueuesGridProps {
  queues: RuntimeQueue[];
  activeTab: string;
  isMobile: boolean;
  userId: string;
  joiningQueue: string | null;
  leavingQueue: string | null;
  pendingOperations: Set<string>;
  showAdmin: boolean;
  showDeveloperAdmin: boolean;
  showManageMaps: boolean;
  showManageQueueBans: boolean;
  canLaunchMatch: (queue: RuntimeQueue) => boolean;
  onTabChange: (tab: string) => void;
  onJoin: (queueId: string) => void;
  onLeave: (queueId: string) => void;
  onLaunch: (queueId: string) => void;
  onFill: (queueId: string) => void;
  onClear: (queueId: string) => void;
  onCopyId: (queueId: string) => void;
  onRemovePlayer: (queueId: string, playerId: string, playerName: string) => void;
  onManageMaps: (queue: RuntimeQueue) => void;
  onDelete: (queue: RuntimeQueue) => void;
  onManageQueueBans: ((queue: RuntimeQueue) => void) | undefined;
}

export function QueuesGrid({
  queues,
  activeTab,
  isMobile,
  userId,
  joiningQueue,
  leavingQueue,
  pendingOperations,
  showAdmin,
  showDeveloperAdmin,
  showManageMaps,
  showManageQueueBans,
  canLaunchMatch,
  onTabChange,
  onJoin,
  onLeave,
  onLaunch,
  onFill,
  onClear,
  onCopyId,
  onRemovePlayer,
  onManageMaps,
  onDelete,
  onManageQueueBans,
}: QueuesGridProps) {
  const renderQueueCard = (queue: RuntimeQueue) => {
    const { activePlayers, waitlistPlayers } = getQueueSections(queue);
    return (
      <QueueCard
        key={queue._id}
        queue={queue}
        activePlayers={activePlayers}
        waitlistPlayers={waitlistPlayers}
        isPlayerInQueue={isPlayerInQueue(queue, userId)}
        canLaunch={canLaunchMatch(queue)}
        hasRequired={activePlayers.length >= queue.teamSize * 2}
        joiningQueue={joiningQueue}
        leavingQueue={leavingQueue}
        pendingOperations={pendingOperations}
        formatJoinTime={formatJoinTime}
        onJoin={() => onJoin(queue._id)}
        onLeave={() => onLeave(queue._id)}
        onLaunch={() => onLaunch(queue._id)}
        onFill={() => onFill(queue._id)}
        onClear={() => onClear(queue._id)}
        onCopyId={() => onCopyId(queue.queueId)}
        onRemovePlayer={(pid, name) => onRemovePlayer(queue._id, pid, name)}
        onManageMaps={() => onManageMaps(queue)}
        onDelete={() => onDelete(queue)}
        showAdmin={showAdmin}
        showDeveloperAdmin={showDeveloperAdmin}
        showManageMaps={showManageMaps}
        showManageQueueBans={showManageQueueBans}
        onManageQueueBans={
          onManageQueueBans ? () => onManageQueueBans(queue) : undefined
        }
      />
    );
  };

  if (isMobile) {
    const filtered = Array.isArray(queues)
      ? queues.filter((q) => q?.teamSize === tabLabelToTeamSize(activeTab))
      : [];
    return (
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between w-full mb-4">
              {activeTab.toUpperCase()} Queues
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {QUEUE_SIZES.map((size) => (
              <DropdownMenuItem key={size} onClick={() => onTabChange(size)}>
                {size} Queues
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="space-y-4">{filtered.map(renderQueueCard)}</div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="flex h-auto p-0 bg-transparent rounded-none border-b border-border/40 w-full justify-start gap-0 mb-6">
        {QUEUE_SIZES.map((size) => (
          <TabsTrigger
            key={size}
            value={size}
            onClick={() => onTabChange(size)}
            className="rounded-none bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary -mb-px transition-colors"
          >
            {size}
          </TabsTrigger>
        ))}
      </TabsList>

      {QUEUE_SIZES.map((size) => {
        const filtered = Array.isArray(queues)
          ? queues.filter((q) => q?.teamSize === tabLabelToTeamSize(size))
          : null;
        return (
          <TabsContent key={size} value={size} className="mt-0">
            {filtered === null ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(renderQueueCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">No {size} queues available</p>
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
