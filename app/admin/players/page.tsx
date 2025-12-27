"use client";

import { useState, useEffect } from "react";
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
import { AlertTriangle, Users, UserCheck, UserX, Shield } from "lucide-react";
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

  const handleActionComplete = () => {
    // Handle action completion
  };

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
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Players
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage player accounts and moderation actions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base font-medium">Total Players</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
            {stats.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                {stats.total}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base font-medium">Active Players</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
            {stats.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                {stats.active}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base font-medium">Banned Players</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
            {stats.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                {stats.banned}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PlayerList />

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
