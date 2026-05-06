"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Settings2, Twitch, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import {
  getTwitchEmbedUrl,
  getYouTubeEmbedUrl,
  type FeaturedVideoSettings,
} from "@/lib/featured-video";
import { canManageFeaturedBroadcast } from "@/lib/security-config";
import { safeLog } from "@/lib/security";

const defaultSettings: FeaturedVideoSettings = {
  type: "none",
  youtubeUrl: "",
  twitchChannel: "",
  title: "",
  lastUpdated: null,
};

export function FeaturedBroadcastEditor() {
  const idPrefix = useId();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [discordRoleIds, setDiscordRoleIds] = useState<string[] | null>(null);
  const [gateLoading, setGateLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] =
    useState<FeaturedVideoSettings>(defaultSettings);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setDiscordRoleIds(null);
      return;
    }

    let cancelled = false;
    setGateLoading(true);
    (async () => {
      try {
        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const userData = await deduplicatedFetch<{ roles: string[] }>(
          "/api/user/data",
          { ttl: 60000 }
        );
        if (!cancelled) setDiscordRoleIds(userData.roles ?? []);
      } catch (e) {
        safeLog.error("FeaturedBroadcastEditor: role fetch failed", e);
        if (!cancelled) setDiscordRoleIds(null);
      } finally {
        if (!cancelled) setGateLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  const canEdit =
    session?.user?.id != null &&
    canManageFeaturedBroadcast(
      session.user.id,
      discordRoleIds ?? [],
      session.user.isAdmin
    );

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { deduplicatedFetch } = await import(
        "@/lib/request-deduplication"
      );
      const data = await deduplicatedFetch<FeaturedVideoSettings>(
        "/api/featured-video",
        { ttl: 0 }
      );
      setSettings({
        ...defaultSettings,
        ...data,
      });
    } catch (e) {
      safeLog.error("FeaturedBroadcastEditor: load settings failed", e);
      toast({
        title: "Error",
        description: "Failed to load broadcast settings",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open || !canEdit) return;
    void loadSettings();
  }, [open, canEdit, loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/featured-video", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: settings.type,
          youtubeUrl: settings.youtubeUrl,
          twitchChannel: settings.twitchChannel,
          title: settings.title,
        }),
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Broadcast settings updated",
        });
        setOpen(false);
        router.refresh();
      } else {
        const err = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description:
            typeof err.error === "string"
              ? err.error
              : "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (e) {
      safeLog.error("FeaturedBroadcastEditor: save failed", e);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (
    status === "unauthenticated" ||
    gateLoading ||
    discordRoleIds === null ||
    !canEdit ||
    status === "loading"
  ) {
    return null;
  }

  const ytPreview =
    settings.type === "youtube" && settings.youtubeUrl
      ? getYouTubeEmbedUrl(settings.youtubeUrl)
      : "";
  const twitchPreview =
    settings.type === "twitch" && settings.twitchChannel
      ? getTwitchEmbedUrl(
          settings.twitchChannel,
          typeof window !== "undefined"
            ? window.location.hostname
            : "localhost"
        )
      : "";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-2 border-border/60 bg-background/40 backdrop-blur-sm"
        onClick={() => setOpen(true)}
      >
        <Settings2 className="h-4 w-4" aria-hidden />
        Edit broadcast
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(92dvh,880px)] w-[min(100vw-1rem,42rem)] max-w-2xl flex-col gap-0 overflow-hidden overscroll-contain p-0 sm:w-full">
          <div className="max-h-[min(78dvh,720px)] overflow-y-auto overscroll-contain p-5 pb-4 sm:p-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle>Broadcast</DialogTitle>
              <DialogDescription>
                Choose YouTube, Twitch, or disable the home page broadcast
                block.
              </DialogDescription>
            </DialogHeader>

            {loadingSettings ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <Label>Source</Label>
                  <RadioGroup
                    value={settings.type}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        type: value as FeaturedVideoSettings["type"],
                      })
                    }
                  >
                    <div className="flex min-h-0 items-center gap-2.5">
                      <RadioGroupItem
                        value="none"
                        id={`${idPrefix}-none`}
                        className="mt-px"
                      />
                      <Label
                        htmlFor={`${idPrefix}-none`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <X className="h-4 w-4" aria-hidden />
                        Disabled
                      </Label>
                    </div>
                    <div className="flex min-h-0 items-center gap-2.5">
                      <RadioGroupItem
                        value="youtube"
                        id={`${idPrefix}-youtube`}
                        className="mt-px"
                      />
                      <Label
                        htmlFor={`${idPrefix}-youtube`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Youtube
                          className="h-4 w-4 text-red-500"
                          aria-hidden
                        />
                        YouTube
                      </Label>
                    </div>
                    <div className="flex min-h-0 items-center gap-2.5">
                      <RadioGroupItem
                        value="twitch"
                        id={`${idPrefix}-twitch`}
                        className="mt-px"
                      />
                      <Label
                        htmlFor={`${idPrefix}-twitch`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Twitch
                          className="h-4 w-4 text-purple-500"
                          aria-hidden
                        />
                        Twitch
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {settings.type === "youtube" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${idPrefix}-yt-url`}>YouTube URL</Label>
                      <Input
                        id={`${idPrefix}-yt-url`}
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={settings.youtubeUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            youtubeUrl: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${idPrefix}-yt-title`}>
                        Title (optional)
                      </Label>
                      <Input
                        id={`${idPrefix}-yt-title`}
                        placeholder="Featured video title"
                        value={settings.title}
                        onChange={(e) =>
                          setSettings({ ...settings, title: e.target.value })
                        }
                      />
                    </div>
                    {ytPreview ? (
                      <div className="rounded-lg bg-muted p-4">
                        <p className="mb-2 text-sm font-medium">Preview</p>
                        <div className="aspect-video w-full overflow-hidden rounded-md">
                          <iframe
                            src={ytPreview}
                            className="h-full w-full"
                            title="YouTube preview"
                            loading="lazy"
                            allow="fullscreen"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {settings.type === "twitch" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${idPrefix}-tw-ch`}>Twitch channel</Label>
                      <Input
                        id={`${idPrefix}-tw-ch`}
                        placeholder="channelname"
                        value={settings.twitchChannel}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            twitchChannel: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${idPrefix}-tw-title`}>
                        Title (optional)
                      </Label>
                      <Input
                        id={`${idPrefix}-tw-title`}
                        placeholder="Live stream"
                        value={settings.title}
                        onChange={(e) =>
                          setSettings({ ...settings, title: e.target.value })
                        }
                      />
                    </div>
                    {twitchPreview ? (
                      <div className="rounded-lg bg-muted p-4">
                        <p className="mb-2 text-sm font-medium">Preview</p>
                        <div className="aspect-video w-full overflow-hidden rounded-md">
                          <iframe
                            src={twitchPreview}
                            className="h-full w-full"
                            title="Twitch preview"
                            loading="lazy"
                            allow="fullscreen"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 gap-2 border-t border-border/60 bg-background/95 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loadingSettings}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
