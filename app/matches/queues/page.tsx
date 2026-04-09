"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FeatureGate } from "@/components/feature-gate";
import { AdminQueueMapPoolDialog } from "@/components/admin/queues/admin-queue-map-pool-dialog";
import { AdminQueueBansDialog } from "@/components/admin/queues/admin-queue-bans-dialog";
import { CreateQueueDialog } from "@/components/queues/create-queue-dialog";
import { QueueRegistrationBanners } from "@/components/queues/queue-registration-banners";
import { QueuesGrid } from "@/components/queues/queues-grid";
import { QueueConfirmDialogs } from "@/components/queues/queue-confirm-dialogs";
import { useQueuesData } from "@/hooks/useQueuesData";
import { useQueuePermissions } from "@/hooks/useQueuePermissions";
import { useQueueRegistration } from "@/hooks/useQueueRegistration";
import { useQueueActions } from "@/hooks/useQueueActions";
import { useQueueMapPool } from "@/hooks/useQueueMapPool";
import { useQueueBans } from "@/hooks/useQueueBans";
import type { RuntimeQueue, AdminQueueRecord } from "@/types/admin-queue";

export default function QueuesPage() {
  const { data: session } = useSession();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [queues, setQueues] = useState<RuntimeQueue[]>([]);
  const [activeTab, setActiveTab] = useState("4v4");
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Fetch user roles once
  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      try {
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<{ roles: string[] }>("/api/user/data", { ttl: 60000 });
        setUserRoles(data.roles ?? []);
      } catch { /* silently ignore */ }
    };
    void load();
  }, [session?.user?.id]);

  const perms = useQueuePermissions(session, userRoles);

  // Realtime queue updates (SSE + polling fallback)
  const mapPool = useQueueMapPool(setQueues);
  useQueuesData({
    userId: session?.user?.id,
    isPrivileged: perms.canManageMaps,
    onQueuesUpdate: (qs) => setQueues(qs),
    onMapsUpdate: (ms) => mapPool.setMaps(ms as never),
    onOriginalMapsUpdate: (ms) => mapPool.setOriginalMaps(ms as never),
  });

  const registration = useQueueRegistration(session);
  const actions = useQueueActions(session, queues, setQueues);
  const bans = useQueueBans(queues, setQueues);

  // Sync active tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamSizeParam = params.get("teamSize");
    if (teamSizeParam) { setActiveTab(`${teamSizeParam}v${teamSizeParam}`); return; }
    const hash = window.location.hash.replace("#", "");
    if (hash && ["1v1", "2v2", "4v4", "5v5", "8v8"].includes(hash)) setActiveTab(hash);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.history.pushState(null, "", `#${tab}`);
  }, []);

  if (!session) {
    return (
      <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-muted-foreground">Please sign in to view queues</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="queues">
      <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/40">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Ranked Matchmaking</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Join queues and compete in ranked matches
            </p>
          </div>
          <div className="w-full sm:w-auto flex sm:justify-end">
            <CreateQueueDialog visible={perms.isAdmin} />
          </div>
        </div>

        {/* Registration banners */}
        <QueueRegistrationBanners
          isRegistered={registration.isRegistered}
          isCheckingRegistration={registration.isCheckingRegistration}
          isRegistering={registration.isRegistering}
          missingTeamSizes={registration.missingTeamSizes}
          isRegisteringMissing={registration.isRegisteringMissing}
          onRegister={registration.handleRegisterForRanked}
          onRegisterMissing={registration.handleRegisterMissingTeamSizes}
        />

        {/* Queue grid */}
        <QueuesGrid
          queues={queues}
          activeTab={activeTab}
          isMobile={isMobile}
          userId={session.user.id}
          joiningQueue={actions.joiningQueue}
          leavingQueue={actions.leavingQueue}
          pendingOperations={actions.pendingOperations}
          showAdmin={perms.isAdmin}
          showDeveloperAdmin={perms.isDeveloperOrAdmin}
          showManageMaps={perms.canManageMaps}
          showManageQueueBans={perms.canManageQueueBans}
          canLaunchMatch={perms.canLaunchMatch}
          onTabChange={handleTabChange}
          onJoin={actions.handleJoinQueue}
          onLeave={actions.handleLeaveQueue}
          onLaunch={actions.handleLaunchMatch}
          onFill={(queueId) => void actions.handleFillQueue(queueId, true)}
          onClear={actions.handleClearQueue}
          onCopyId={actions.copyToClipboard}
          onRemovePlayer={actions.handleRemovePlayer}
          onManageMaps={(queue) => {
            mapPool.setManagingMapsQueue(queue as AdminQueueRecord);
            mapPool.setMapsDialogOpen((prev) => ({ ...prev, [queue._id]: true }));
          }}
          onDelete={(queue) =>
            actions.handleDeleteQueue(
              queue._id,
              queue.gameType ?? "Queue",
              queue.eloTier ?? "any",
              queue.teamSize,
            )
          }
          onManageQueueBans={
            perms.canManageQueueBans
              ? (queue) => void bans.openBannedPlayersDialogForQueue(queue as AdminQueueRecord)
              : undefined
          }
        />

        {/* Moderation log footer */}
        <div className="mt-10 rounded-xl border border-border/50 bg-muted/15 px-4 py-4 sm:mt-12 sm:px-5 sm:py-5">
          <p className="text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
            <Link
              href="/moderation-log"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Public Moderation Log
            </Link>
            <span className="text-muted-foreground">
              {" "}— view warnings, bans, and queue removals for community transparency.
            </span>
          </p>
        </div>
      </div>

      {/* Confirm dialogs */}
      <QueueConfirmDialogs
        playerToRemove={actions.playerToRemove}
        queueToDelete={actions.queueToDelete}
        onCancelRemove={() => actions.setPlayerToRemove(null)}
        onConfirmRemove={actions.confirmRemovePlayer}
        onCancelDelete={() => actions.setQueueToDelete(null)}
        onConfirmDelete={actions.confirmDeleteQueue}
      />

      {/* Admin: map pool dialog */}
      <AdminQueueMapPoolDialog
        open={
          mapPool.managingMapsQueue
            ? (mapPool.mapsDialogOpen[mapPool.managingMapsQueue._id] ?? false)
            : false
        }
        onOpenChange={mapPool.handleMapPoolDialogOpenChange}
        queue={mapPool.managingMapsQueue}
        filteredMaps={mapPool.mapPoolDialogFilteredMaps}
        mapPoolSearch={mapPool.mapPoolSearch}
        setMapPoolSearch={mapPool.setMapPoolSearch}
        selectedMapIds={
          mapPool.managingMapsQueue
            ? (mapPool.selectedMaps[mapPool.managingMapsQueue._id] ?? [])
            : []
        }
        totalMapCount={mapPool.maps.length}
        onToggleMap={(mapId) =>
          mapPool.managingMapsQueue &&
          mapPool.toggleMapSelection(mapPool.managingMapsQueue._id, mapId)
        }
        onSelectAllMaps={() =>
          mapPool.managingMapsQueue &&
          mapPool.selectAllMaps(mapPool.managingMapsQueue._id)
        }
        onDeselectAllMaps={() =>
          mapPool.managingMapsQueue &&
          mapPool.deselectAllMaps(mapPool.managingMapsQueue._id)
        }
        saving={Boolean(
          mapPool.managingMapsQueue && mapPool.saving[mapPool.managingMapsQueue._id],
        )}
        onSave={async () => {
          if (!mapPool.managingMapsQueue || mapPool.saving[mapPool.managingMapsQueue._id]) return;
          await mapPool.handleSaveMaps(mapPool.managingMapsQueue);
        }}
      />

      {/* Admin: banned players dialog */}
      <AdminQueueBansDialog
        open={
          bans.managingBannedPlayersQueue
            ? (bans.bannedPlayersDialogOpen[bans.managingBannedPlayersQueue._id] ?? false)
            : false
        }
        onOpenChange={bans.handleBansDialogOpenChange}
        queue={bans.managingBannedPlayersQueue}
        playerSearch={bans.playerSearch}
        onPlayerSearchChange={bans.handleBannedPlayerSearchChange}
        searchResults={bans.searchResults}
        bannedPlayers={bans.bannedPlayers}
        setBannedPlayers={bans.setBannedPlayers}
        bannedPlayersInfo={bans.bannedPlayersInfo}
        setBannedPlayersInfo={bans.setBannedPlayersInfo}
        savingBannedPlayers={bans.savingBannedPlayers}
        onSave={bans.saveBannedPlayersList}
      />
    </FeatureGate>
  );
}
