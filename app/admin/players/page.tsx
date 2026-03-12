"use client";

import { useState, useEffect, useCallback } from "react";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Users, UserCheck, UserX, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PlayerList } from "@/components/player-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayersPage() {
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rule, setRule] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    loading: true,
  });

  const refetchStats = useCallback(async () => {
    try {
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const players = await deduplicatedFetch<any[]>("/api/admin/players", {
        ttl: 0, // bypass cache for refetch
      });
      const active = players.filter((p: any) => !p.isBanned).length;
      const banned = players.filter((p: any) => p.isBanned).length;
      setStats((prev) => ({
        ...prev,
        total: players.length,
        active,
        banned,
        loading: false,
      }));
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const handleActionComplete = useCallback(() => {
    refetchStats();
  }, [refetchStats]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setReasonError("Reason is required");
      return;
    }
    // Submit warning
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ✅ Use deduplication for admin players list
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const players = await deduplicatedFetch<any[]>("/api/admin/players", {
          ttl: 60000, // Cache for 1 minute
        });
          const active = players.filter((p: any) => !p.isBanned).length;
          const banned = players.filter((p: any) => p.isBanned).length;
          setStats({
            total: players.length,
            active,
            banned,
            loading: false,
          });
      } catch (error) {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10 space-y-5 sm:space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Players
          </h1>
          <p className="text-sm text-muted-foreground mt-1" id="players-description">
            Manage player accounts and moderation actions
          </p>
        </div>
        <Button
          onClick={() => setAddPlayerOpen(true)}
          className="w-full sm:w-auto shrink-0"
          aria-describedby="players-description"
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          Add player
        </Button>
      </header>

      {/* Stats Cards - softer, modern style */}
      <section aria-label="Player statistics" className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300" aria-label={`Total players: ${stats.loading ? "loading" : stats.total}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" aria-hidden />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500/90" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 sm:px-6 pb-5 sm:pb-6">
            {stats.loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {stats.total}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300" aria-label={`Active players: ${stats.loading ? "loading" : stats.active}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" aria-hidden />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Players</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500/90" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 sm:px-6 pb-5 sm:pb-6">
            {stats.loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {stats.active}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm hover:shadow-md hover:border-rose-500/30 transition-all duration-300" aria-label={`Banned players: ${stats.loading ? "loading" : stats.banned}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" aria-hidden />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Banned Players</CardTitle>
            <div className="p-2 rounded-xl bg-rose-500/10">
              <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500/90" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 sm:px-6 pb-5 sm:pb-6">
            {stats.loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {stats.banned}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="players-list-heading" className="space-y-4 sm:space-y-6">
        <h2 id="players-list-heading" className="sr-only">
          Player list
        </h2>
        <PlayerList onModerationSuccess={refetchStats} />
      </section>

      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        onComplete={handleActionComplete}
      />

      <Dialog
        open={warnDialogOpen}
        onOpenChange={(open) => setWarnDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Issue Warning
            </DialogTitle>
            <DialogDescription>
              Issue a warning to this player for violating the rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rule">Rule Violated</Label>
              <Select value={rule} onValueChange={setRule}>
                <SelectTrigger id="rule" className="min-h-[44px] sm:min-h-0">
                  <SelectValue placeholder="Select a rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="offensive">Offensive Content</SelectItem>
                  <SelectItem value="cheating">Cheating</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this action is being taken..."
                className="min-h-[120px] resize-none"
                required
              />
              {reasonError && (
                <p className="text-sm text-red-500">{reasonError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWarnDialogOpen(false)}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
              Issue Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
