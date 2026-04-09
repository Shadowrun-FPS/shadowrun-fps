"use client";

import { useRef, Suspense } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { DisputeReviewDialog } from "@/components/dispute-review-dialog";
import { useModerationData } from "@/hooks/useModerationData";
import { ModerationTabNav } from "@/components/admin/moderation/moderation-tab-nav";
import { ModerationOverviewTab } from "@/components/admin/moderation/moderation-overview-tab";
import { ModerationActiveBansTab } from "@/components/admin/moderation/moderation-active-bans-tab";
import { ModerationRecentTab } from "@/components/admin/moderation/moderation-recent-tab";
import { ModerationDisputesTab } from "@/components/admin/moderation/moderation-disputes-tab";
import { ModerationUnbanDialog } from "@/components/admin/moderation/moderation-unban-dialog";
import { ModerationDetailSheet } from "@/components/admin/moderation/moderation-detail-sheet";

function ModerationPanelContent() {
  const pageRootRef = useRef<HTMLDivElement>(null);
  const overviewBelowStatsRef = useRef<HTMLElement>(null);

  const data = useModerationData({ pageRootRef, overviewBelowStatsRef });

  return (
    <div
      ref={pageRootRef}
      className="space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10 xl:px-12"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Moderation Panel
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage player warnings, bans, and disputes
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => data.refetch({ bypassCache: true })}
          disabled={data.loading}
          className="shrink-0 gap-2 self-stretch sm:self-center sm:min-h-10"
          title="Refresh data"
        >
          {data.loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={data.activeTab} onValueChange={data.onTabChange} className="w-full">
        <ModerationTabNav activeTab={data.activeTab} onTabChange={data.onTabChange} />

        <ModerationOverviewTab
          loading={data.loading}
          logs={data.logs}
          disputes={data.disputes}
          stats={data.stats}
          showScrollToOverviewContentCue={data.showScrollToOverviewContentCue}
          overviewBelowStatsRef={overviewBelowStatsRef}
          scrollToOverviewMainContent={data.scrollToOverviewMainContent}
          onTabChange={data.onTabChange}
          onViewDispute={data.handleViewDispute}
          isUnbanned={data.isUnbanned}
        />

        <ModerationActiveBansTab
          loading={data.loading}
          activeActions={data.activeActions}
          filteredActiveBans={data.filteredActiveBans}
          sortedFilteredActiveBans={data.sortedFilteredActiveBans}
          activeBansSort={data.activeBansSort}
          activeSearchQuery={data.activeSearchQuery}
          unbanInProgressId={data.unbanInProgressId}
          isUnbanned={data.isUnbanned}
          setActiveSearchQuery={data.setActiveSearchQuery}
          cycleActiveBansSort={data.cycleActiveBansSort}
          openUnbanConfirm={data.openUnbanConfirm}
        />

        <ModerationRecentTab
          loading={data.loading}
          logs={data.logs}
          stats={data.stats}
          filter={data.filter}
          searchQuery={data.searchQuery}
          recentActionsSort={data.recentActionsSort}
          filteredRecentActions={data.filteredRecentActions}
          sortedFilteredRecentActions={data.sortedFilteredRecentActions}
          unbanInProgressId={data.unbanInProgressId}
          isUnbanned={data.isUnbanned}
          setSearchQuery={data.setSearchQuery}
          onFilterChange={data.onFilterChange}
          cycleRecentActionsSort={data.cycleRecentActionsSort}
          openUnbanConfirm={data.openUnbanConfirm}
          setDetailLog={data.setDetailLog}
          setDetailOpen={data.setDetailOpen}
          handleViewHistory={data.handleViewHistory}
        />

        <ModerationDisputesTab
          loading={data.loading}
          disputes={data.disputes}
          onViewDispute={data.handleViewDispute}
        />
      </Tabs>

      <ModerationUnbanDialog
        unbanConfirm={data.unbanConfirm}
        unbanTypedPlayerName={data.unbanTypedPlayerName}
        unbanInProgressId={data.unbanInProgressId}
        setUnbanConfirm={data.setUnbanConfirm}
        setUnbanTypedPlayerName={data.setUnbanTypedPlayerName}
        performUnban={data.performUnban}
      />

      <ModerationDetailSheet
        detailLog={data.detailLog}
        detailOpen={data.detailOpen}
        setDetailOpen={data.setDetailOpen}
        setDetailLog={data.setDetailLog}
      />

      {data.selectedDispute && (
        <DisputeReviewDialog
          dispute={data.selectedDispute}
          open={data.disputeDialogOpen}
          onOpenChange={data.setDisputeDialogOpen}
          onDisputeResolved={data.handleDisputeResolved}
        />
      )}
    </div>
  );
}

export default function ModerationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ModerationPanelContent />
    </Suspense>
  );
}
