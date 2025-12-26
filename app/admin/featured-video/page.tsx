"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Youtube, Twitch, X } from "lucide-react";

interface FeaturedVideoSettings {
  type: "none" | "youtube" | "twitch";
  youtubeUrl: string;
  twitchChannel: string;
  title: string;
}

export default function FeaturedVideoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FeaturedVideoSettings>({
    type: "none",
    youtubeUrl: "",
    twitchChannel: "",
    title: "",
  });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/featured-video");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load featured video settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/featured-video", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Featured video settings updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const extractYouTubeVideoId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return "";
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return "";
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const getTwitchEmbedUrl = (channel: string): string => {
    if (!channel) return "";
    const cleanChannel = channel
      .replace(/^https?:\/\/(www\.)?twitch\.tv\//, "")
      .replace(/\/$/, "");
    return `https://player.twitch.tv/?channel=${cleanChannel}&parent=${window.location.hostname}&muted=false`;
  };

  if (loading || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Featured Video Settings</CardTitle>
          <CardDescription>
            Configure the featured video displayed on the home page. You can
            choose to show a YouTube video, a live Twitch stream, or disable it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Video Type</Label>
            <RadioGroup
              value={settings.type}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  type: value as "none" | "youtube" | "twitch",
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label
                  htmlFor="none"
                  className="flex gap-2 items-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Disabled
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="youtube" id="youtube" />
                <Label
                  htmlFor="youtube"
                  className="flex gap-2 items-center cursor-pointer"
                >
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube Video
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="twitch" id="twitch" />
                <Label
                  htmlFor="twitch"
                  className="flex gap-2 items-center cursor-pointer"
                >
                  <Twitch className="w-4 h-4 text-purple-500" />
                  Twitch Stream
                </Label>
              </div>
            </RadioGroup>
          </div>

          {settings.type === "youtube" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input
                  id="youtubeUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={settings.youtubeUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, youtubeUrl: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Paste the full YouTube URL or video ID
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Video Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Featured Video Title"
                  value={settings.title}
                  onChange={(e) =>
                    setSettings({ ...settings, title: e.target.value })
                  }
                />
              </div>
              {settings.youtubeUrl && (
                <div className="p-4 mt-4 rounded-lg bg-muted">
                  <p className="mb-2 text-sm font-medium">Preview:</p>
                  <div className="overflow-hidden w-full rounded aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(settings.youtubeUrl)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {settings.type === "twitch" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitchChannel">Twitch Channel</Label>
                <Input
                  id="twitchChannel"
                  placeholder="channelname"
                  value={settings.twitchChannel}
                  onChange={(e) =>
                    setSettings({ ...settings, twitchChannel: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Enter the Twitch channel name (e.g., &quot;channelname&quot;
                  or full URL)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Live Stream"
                  value={settings.title}
                  onChange={(e) =>
                    setSettings({ ...settings, title: e.target.value })
                  }
                />
              </div>
              {settings.twitchChannel && (
                <div className="p-4 mt-4 rounded-lg bg-muted">
                  <p className="mb-2 text-sm font-medium">Preview:</p>
                  <div className="overflow-hidden w-full rounded aspect-video">
                    <iframe
                      src={getTwitchEmbedUrl(settings.twitchChannel)}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      title="Twitch preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
