"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Shield,
  Hash,
  Eye,
  Settings,
  Copy,
  X,
  Check,
  Loader2,
  Trophy,
  Pencil,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RankConfig {
  min: number;
  max: number;
  emojiId?: string;
  roleId?: string;
}

interface GuildSettings {
  _id: string;
  guildId: string;
  guildName: string;
  guildIcon: string;
  adminRoleIds: string[];
  moderatorRoleIds: string[];
  queueManagerRoleIds: string[];
  tournamentManagerRoleIds: string[];
  rankedCategoryId?: string;
  queueChannelId?: string;
  matchChannelId?: string;
  leaderboardChannelId?: string;
  teamsChannelId?: string;
  tournamentsChannelId?: string;
  logsChannelId?: string;
  hideNameElo: boolean;
  ranks?: {
    bronze?: RankConfig;
    silver?: RankConfig;
    gold?: RankConfig;
    platinum?: RankConfig;
    diamond?: RankConfig;
    obsidian?: RankConfig;
  };
  settings: {
    defaultELO: number;
    defaultMapPool: string[];
    queueAutoRemoveEnabled: boolean;
    queueAutoRemoveTimeout: number;
    queueLaunchMode: string;
    voiceAutoMoveEnabled: boolean;
    matchWinLogic: number;
    mapWinLogic: number;
  };
}

interface DiscordRole {
  id: string;
  name: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

interface Map {
  _id: string;
  name: string;
  src: string;
}

export default function GuildSettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [searchRole, setSearchRole] = useState("");
  const [searchChannel, setSearchChannel] = useState("");
  const [adminRoleSearch, setAdminRoleSearch] = useState("");
  const [moderatorRoleSearch, setModeratorRoleSearch] = useState("");
  const [queueManagerRoleSearch, setQueueManagerRoleSearch] = useState("");
  const [tournamentManagerRoleSearch, setTournamentManagerRoleSearch] =
    useState("");

  // Debounce hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedAdminSearch = useDebounce(adminRoleSearch, 300);
  const debouncedModeratorSearch = useDebounce(moderatorRoleSearch, 300);
  const debouncedQueueManagerSearch = useDebounce(queueManagerRoleSearch, 300);
  const debouncedTournamentManagerSearch = useDebounce(
    tournamentManagerRoleSearch,
    300
  );

  const fetchMaps = useCallback(async () => {
    try {
      // ✅ Use deduplication for maps
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<any[]>("/api/maps", {
        ttl: 60000, // Cache for 1 minute
      });
      
      const allMaps: Map[] = [];
      const seenIds = new Set<string>();

      // Get current defaultMapPool to check for small variants
      const currentPool = settings?.settings?.defaultMapPool || [];
      const mapsWithSmallVariants = new Set<string>();

      // Check defaultMapPool for small variants
      currentPool.forEach((mapId: string) => {
        if (typeof mapId === "string" && mapId.endsWith(":small")) {
          const baseId = mapId.replace(":small", "");
          mapsWithSmallVariants.add(baseId);
        }
      });

      data.forEach((map: any) => {
        // Only add if we have a valid _id and haven't seen it before
        if (map._id && !seenIds.has(map._id)) {
          seenIds.add(map._id);
          allMaps.push(map);

          // Create small variant if map has smallOption flag OR if it's in the defaultMapPool with :small
          if (map.smallOption || mapsWithSmallVariants.has(map._id)) {
            const smallId = `${map._id}:small`;
            if (!seenIds.has(smallId)) {
              seenIds.add(smallId);
              allMaps.push({
                _id: smallId,
                name: `${map.name} (Small)`,
                src: `/maps/map_${map.name
                  .toLowerCase()
                  .replace(/\s+/g, "")}.png`,
              });
            }
          }
        }
      });
      setMaps(allMaps);
    } catch (error) {
      console.error("Error fetching maps:", error);
    }
  }, [settings]);

  const fetchGuildSettings = useCallback(async () => {
    try {
      // ✅ Use deduplication for guild settings
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<any>("/api/admin/guild-settings", {
        ttl: 60000, // Cache for 1 minute
      });

      // Initialize missing fields with defaults
      if (!data.settings) {
        data.settings = {};
      }

      // Ensure all settings fields have default values
      data.settings = {
        defaultELO: data.settings.defaultELO ?? 800,
        defaultMapPool: Array.isArray(data.settings.defaultMapPool)
          ? data.settings.defaultMapPool
          : [],
        queueAutoRemoveEnabled: data.settings.queueAutoRemoveEnabled ?? false,
        queueAutoRemoveTimeout: data.settings.queueAutoRemoveTimeout ?? 60,
        queueLaunchMode: data.settings.queueLaunchMode ?? "ready-check",
        voiceAutoMoveEnabled: data.settings.voiceAutoMoveEnabled ?? false,
        matchWinLogic: data.settings.matchWinLogic ?? 3,
        mapWinLogic: data.settings.mapWinLogic ?? 6,
        ...data.settings, // Keep any existing settings
      };

      // Ensure role arrays exist
      data.adminRoleIds = Array.isArray(data.adminRoleIds)
        ? data.adminRoleIds
        : [];
      data.moderatorRoleIds = Array.isArray(data.moderatorRoleIds)
        ? data.moderatorRoleIds
        : [];
      data.queueManagerRoleIds = Array.isArray(data.queueManagerRoleIds)
        ? data.queueManagerRoleIds
        : [];
      data.tournamentManagerRoleIds = Array.isArray(
        data.tournamentManagerRoleIds
      )
        ? data.tournamentManagerRoleIds
        : [];

      // Ensure ranks object exists
      if (!data.ranks) {
        data.ranks = {};
      }

      setSettings(data);
    } catch (error) {
      console.error("Error fetching guild settings:", error);
      toast({
        title: "Error",
        description: "Failed to load guild settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // ✅ Parallelize all fetches
    const fetchAll = async () => {
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      await Promise.all([
        fetchGuildSettings(),
        deduplicatedFetch<{ roles: any[] }>("/api/discord/roles", {
          ttl: 300000, // Cache for 5 minutes
        })
          .then((data) => setRoles(data.roles || []))
          .catch((error) => console.error("Error fetching Discord roles:", error)),
        deduplicatedFetch<{ channels: any[] }>("/api/discord/channels", {
          ttl: 300000, // Cache for 5 minutes
        })
          .then((data) => setChannels(data.channels || []))
          .catch((error) => console.error("Error fetching Discord channels:", error)),
      ]);
    };
    fetchAll();
  }, [fetchGuildSettings]);

  // Fetch maps after settings are loaded so we can check for small variants
  useEffect(() => {
    if (settings) {
      fetchMaps();
    }
  }, [settings, fetchMaps]);

  // ✅ Removed separate fetch functions - now handled in useEffect with parallelization

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/guild-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({
        title: "Success",
        description: "Guild settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save guild settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addRole = (
    roleId: string,
    type: keyof Pick<
      GuildSettings,
      | "adminRoleIds"
      | "moderatorRoleIds"
      | "queueManagerRoleIds"
      | "tournamentManagerRoleIds"
    >
  ) => {
    if (!settings) return;
    if (!settings[type].includes(roleId)) {
      setSettings({
        ...settings,
        [type]: [...settings[type], roleId],
      });
    }
  };

  const removeRole = (
    roleId: string,
    type: keyof Pick<
      GuildSettings,
      | "adminRoleIds"
      | "moderatorRoleIds"
      | "queueManagerRoleIds"
      | "tournamentManagerRoleIds"
    >
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [type]: settings[type].filter((id) => id !== roleId),
    });
  };

  const toggleMap = (mapId: string) => {
    if (!settings) return;
    const currentPool = settings.settings.defaultMapPool || [];
    const newPool = currentPool.includes(mapId)
      ? currentPool.filter((id) => id !== mapId)
      : [...currentPool, mapId];

    setSettings({
      ...settings,
      settings: {
        ...settings.settings,
        defaultMapPool: newPool,
      },
    });
  };

  // Filter roles based on search for each section
  const getFilteredRoles = (searchTerm: string) => {
    if (!searchTerm) return roles;
    return roles.filter((role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchChannel.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container py-8 mx-auto">
        <p className="text-center text-muted-foreground">
          No guild settings found
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Guild Settings</h1>
          <p className="text-muted-foreground">
            Configure your Discord server &apos;s bot settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Server Information */}
      <Card>
        <CardHeader className="flex flex-row gap-3 items-start p-6">
          <div className="flex justify-center items-center p-3 rounded-lg bg-primary/10">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Server Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              View your Discord server &apos;s unique identifier
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Server ID</Label>
            <div className="flex gap-2 mt-2">
              <Input value={settings.guildId} disabled className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(settings.guildId);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This is your Discord server &apos;s unique identifier. Use this
              when contacting support or reporting issues.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permission Roles */}
      <Card>
        <CardHeader className="flex flex-row gap-3 items-start p-6">
          <div className="flex justify-center items-center p-3 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Permission Roles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure which Discord roles have access to various bot features
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Roles */}
          <div>
            <Label>Admin Roles</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Users with these roles have full access to all bot features and
              settings
            </p>
            <Input
              placeholder="Search roles..."
              value={adminRoleSearch}
              onChange={(e) => setAdminRoleSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.adminRoleIds.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return (
                  <Badge key={roleId} variant="secondary" className="gap-1">
                    {role?.name || roleId}
                    <button
                      onClick={() => removeRole(roleId, "adminRoleIds")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Select onValueChange={(value) => addRole(value, "adminRoleIds")}>
              <SelectTrigger>
                <SelectValue placeholder="Add admin role..." />
              </SelectTrigger>
              <SelectContent>
                {getFilteredRoles(debouncedAdminSearch)
                  .filter((role) => !settings.adminRoleIds.includes(role.id))
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Moderator Roles */}
          <div>
            <Label>Moderator Roles</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Users with these roles can manage players, queues, and moderation
              actions
            </p>
            <Input
              placeholder="Search roles..."
              value={moderatorRoleSearch}
              onChange={(e) => setModeratorRoleSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.moderatorRoleIds.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return (
                  <Badge key={roleId} variant="secondary" className="gap-1">
                    {role?.name || roleId}
                    <button
                      onClick={() => removeRole(roleId, "moderatorRoleIds")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Select
              onValueChange={(value) => addRole(value, "moderatorRoleIds")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add moderator role..." />
              </SelectTrigger>
              <SelectContent>
                {getFilteredRoles(debouncedModeratorSearch)
                  .filter(
                    (role) => !settings.moderatorRoleIds.includes(role.id)
                  )
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Queue Manager Roles */}
          <div>
            <Label>Queue Manager Roles</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Users with these roles can create, edit, and manage queues
            </p>
            <Input
              placeholder="Search roles..."
              value={queueManagerRoleSearch}
              onChange={(e) => setQueueManagerRoleSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.queueManagerRoleIds.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return (
                  <Badge key={roleId} variant="secondary" className="gap-1">
                    {role?.name || roleId}
                    <button
                      onClick={() => removeRole(roleId, "queueManagerRoleIds")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Select
              onValueChange={(value) => addRole(value, "queueManagerRoleIds")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add queue manager role..." />
              </SelectTrigger>
              <SelectContent>
                {getFilteredRoles(debouncedQueueManagerSearch)
                  .filter(
                    (role) => !settings.queueManagerRoleIds.includes(role.id)
                  )
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Tournament Manager Roles */}
          <div>
            <Label>Tournament Manager Roles</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Users with these roles can create, edit, and manage tournaments
            </p>
            <Input
              placeholder="Search roles..."
              value={tournamentManagerRoleSearch}
              onChange={(e) => setTournamentManagerRoleSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.tournamentManagerRoleIds.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return (
                  <Badge key={roleId} variant="secondary" className="gap-1">
                    {role?.name || roleId}
                    <button
                      onClick={() =>
                        removeRole(roleId, "tournamentManagerRoleIds")
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Select
              onValueChange={(value) =>
                addRole(value, "tournamentManagerRoleIds")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Add tournament manager role..." />
              </SelectTrigger>
              <SelectContent>
                {getFilteredRoles(debouncedTournamentManagerSearch)
                  .filter(
                    (role) =>
                      !settings.tournamentManagerRoleIds.includes(role.id)
                  )
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Channel Settings */}
      <Card>
        <CardHeader className="flex flex-row gap-3 items-start p-6">
          <div className="flex justify-center items-center p-3 rounded-lg bg-primary/10">
            <Hash className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Channel Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure where bot embeds and messages are posted
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Ranked Category</Label>
            <Select
              value={settings.rankedCategoryId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  rankedCategoryId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 4)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Queue Channel</Label>
            <Select
              value={settings.queueChannelId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  queueChannelId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Match Channel</Label>
            <Select
              value={settings.matchChannelId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  matchChannelId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Leaderboard Channel</Label>
            <Select
              value={settings.leaderboardChannelId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  leaderboardChannelId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Teams Channel</Label>
            <Select
              value={settings.teamsChannelId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  teamsChannelId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tournaments Channel</Label>
            <Select
              value={settings.tournamentsChannelId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  tournamentsChannelId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Logs Channel</Label>
            <Select
              value={settings.logsChannelId || ""}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  logsChannelId: value || undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter((ch) => ch.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-sm text-muted-foreground">
              Moderation logs (warns, bans, unbans) will be posted to this
              channel. Only admins, configured admin roles, and moderators can
              view this channel. The bot will automatically set channel
              permissions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader className="flex flex-row gap-3 items-start p-6">
          <div className="flex justify-center items-center p-3 rounded-lg bg-primary/10">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Display Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure how player information is displayed
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <Label>Hide Player Names and ELO</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, player names and ELO ratings will be hidden in
                public displays
              </p>
            </div>
            <Switch
              checked={settings.hideNameElo}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  hideNameElo: checked,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader className="flex flex-row gap-3 items-start p-6">
          <div className="flex justify-center items-center p-3 rounded-lg bg-primary/10">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>General Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure basic QueueLink settings for this server
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Player Registration Defaults */}
          <div>
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <div className="flex justify-center items-center w-8 h-8 rounded-md bg-primary/10">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              Player Registration Defaults
            </h3>
            <div>
              <Label>Default Starting ELO</Label>
              <Input
                type="number"
                value={settings.settings.defaultELO}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    settings: {
                      ...settings.settings,
                      defaultELO: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="mt-2"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Default ELO rating assigned to newly registered players for all
                team sizes
              </p>
            </div>
          </div>

          <Separator />

          {/* Queue Defaults */}
          <div>
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <div className="flex justify-center items-center w-8 h-8 rounded-md bg-primary/10">
                <Server className="w-4 h-4 text-primary" />
              </div>
              Queue Defaults
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Default Map Pool</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.settings.defaultMapPool?.length || 0} selected
                  </span>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Select maps to include in the default map pool for new queues.
                  If no maps are selected, all maps will be used.
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {maps.map((map) => (
                    <div
                      key={map._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        settings.settings.defaultMapPool?.includes(map._id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleMap(map._id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{map.name}</span>
                        {settings.settings.defaultMapPool?.includes(
                          map._id
                        ) && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Queue Auto-Remove</Label>
                  <Switch
                    checked={settings.settings.queueAutoRemoveEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        settings: {
                          ...settings.settings,
                          queueAutoRemoveEnabled: checked,
                        },
                      })
                    }
                  />
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Automatically remove inactive players from queues after a
                  timeout period
                </p>
                {settings.settings.queueAutoRemoveEnabled && (
                  <div>
                    <Label>Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={settings.settings.queueAutoRemoveTimeout}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          settings: {
                            ...settings.settings,
                            queueAutoRemoveTimeout:
                              parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="mt-2"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Players will be automatically removed from queues after
                      this many minutes of inactivity (1-1440 minutes, default:
                      60)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>Queue Launch Mode</Label>
                <Select
                  value={settings.settings.queueLaunchMode}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        queueLaunchMode: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ready-check">Ready-Check</SelectItem>
                    <SelectItem value="manual">Manual Launch</SelectItem>
                    <SelectItem value="voice">Voice Launch</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-muted-foreground">
                  Determines how ranked queues launch matches. Manual Launch
                  uses the &quot;Launch Match&quot; button, Ready-Check requires
                  players to ready up, and Voice Launch auto-launches when all
                  required players join the configured voice channel.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Voice Auto-Move</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically move players to team voice channels during
                      matches (works with all launch modes)
                    </p>
                  </div>
                  <Switch
                    checked={settings.settings.voiceAutoMoveEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        settings: {
                          ...settings.settings,
                          voiceAutoMoveEnabled: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Match Settings */}
          <div>
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <div className="flex justify-center items-center w-8 h-8 rounded-md bg-primary/10">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              Match Settings
            </h3>

            <div className="space-y-4">
              <div>
                <Label>Match Win Logic (Best of X)</Label>
                <Input
                  type="number"
                  value={settings.settings.matchWinLogic}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        matchWinLogic: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="mt-2"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Number of maps in a match (must be odd: 1, 3, or 5). First
                  team to win 2 maps wins the match. This applies to queue
                  matches, tournament matches, and scrimmage matches.
                </p>
              </div>

              <div>
                <Label>Map Win Logic (First to X)</Label>
                <Input
                  type="number"
                  value={settings.settings.mapWinLogic}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        mapWinLogic: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="mt-2"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Target score needed to win a map (e.g., 6 = first to 6, 50 =
                  first to 50). This can represent rounds, kills, points, or any
                  other scoring metric depending on your game mode. This applies
                  to all match types.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rank Roles */}
      <Card>
        <CardHeader className="flex flex-row gap-3 items-start p-6">
          <div className="flex justify-center items-center p-3 rounded-lg bg-primary/10">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Rank Roles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure ELO ranges and Discord roles for each rank tier
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {[
              "bronze",
              "silver",
              "gold",
              "platinum",
              "diamond",
              "obsidian",
            ].map((rankName) => {
              const rank = settings.ranks?.[
                rankName as keyof typeof settings.ranks
              ] || {
                min: 0,
                max: 0,
              };
              const rankDisplayName =
                rankName.charAt(0).toUpperCase() + rankName.slice(1);
              const selectedRole = roles.find((r) => r.id === rank.roleId);

              return (
                <AccordionItem key={rankName} value={rankName}>
                  <AccordionTrigger>
                    <div className="flex gap-3 items-center">
                      <div className="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{rankDisplayName}</div>
                        <div className="text-sm text-muted-foreground">
                          ELO Range: {rank.min || 0} - {rank.max || 0}
                          {rank.emojiId && ` • Emoji: ${rank.emojiId}`}
                          {selectedRole && ` • Role: ${selectedRole.name}`}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min ELO</Label>
                          <Input
                            type="number"
                            value={rank.min || 0}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                ranks: {
                                  ...settings.ranks,
                                  [rankName]: {
                                    ...rank,
                                    min: parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Max ELO</Label>
                          <Input
                            type="number"
                            value={rank.max || 0}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                ranks: {
                                  ...settings.ranks,
                                  [rankName]: {
                                    ...rank,
                                    max: parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Emoji ID</Label>
                        <Input
                          value={rank.emojiId || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              ranks: {
                                ...settings.ranks,
                                [rankName]: {
                                  ...rank,
                                  emojiId: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="Discord emoji ID"
                          className="mt-2"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Discord emoji ID for this rank
                        </p>
                      </div>
                      <div>
                        <Label>Role (Optional)</Label>
                        <Select
                          value={rank.roleId || "none"}
                          onValueChange={(value) =>
                            setSettings({
                              ...settings,
                              ranks: {
                                ...settings.ranks,
                                [rankName]: {
                                  ...rank,
                                  roleId: value === "none" ? undefined : value,
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select role..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Discord role to assign to players in this rank
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button at Bottom */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 w-4 h-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
