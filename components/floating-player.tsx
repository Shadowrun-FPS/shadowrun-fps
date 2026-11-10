"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import { Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Branded artwork used for the play button and the OS media controls. */
const PLAYER_ARTWORK_SRC = "/ability-wheel-magic.png";
const TARGET_VOLUME = 0.6;
const FADE_IN_MS = 600;
const FADE_OUT_MS = 250;
const MUTED_STORAGE_KEY = "shadowrun-player-muted";
const SEEK_STEP_SECONDS = 10;

interface FloatingPlayerProps {
  audioSrc: string;
  trackTitle?: string;
  artist?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function readStoredMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function FloatingPlayerComponent({
  audioSrc,
  trackTitle = "Shadowrun FPS Theme",
  artist,
  className,
}: FloatingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrameRef = useRef(0);

  // Only ever rendered client-side (dynamic import, ssr: false), so reading
  // localStorage in the initializer cannot cause a hydration mismatch.
  const [isMuted, setIsMuted] = useState(readStoredMuted);
  const [isActive, setIsActive] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isExpanded = isActive || hasError;

  const setSessionPlaybackState = useCallback((state: MediaSessionPlaybackState) => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // Some browsers reject the state during a teardown.
    }
  }, []);

  // Pause without a fade. requestAnimationFrame does not run while the phone
  // is locked, so a fade would hold pause() until the page is visible again.
  const stopNow = useCallback(() => {
    const audio = audioRef.current;
    cancelAnimationFrame(fadeFrameRef.current);
    if (!audio) return;
    audio.pause();
    setIsActive(false);
    setIsBuffering(false);
    setSessionPlaybackState("paused");
  }, [setSessionPlaybackState]);

  const fadeTo = useCallback((targetVolume: number, durationMs: number) => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve();

    cancelAnimationFrame(fadeFrameRef.current);
    const startVolume = audio.volume;
    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;
        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      fadeFrameRef.current = requestAnimationFrame(step);
    });
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasError(false);
    setIsActive(true);
    setIsBuffering(true);

    try {
      if (document.hidden) {
        // The fade uses animation frames, which do not run on a locked phone.
        cancelAnimationFrame(fadeFrameRef.current);
        audio.volume = TARGET_VOLUME;
        if (audio.paused) await audio.play();
        setSessionPlaybackState("playing");
        return;
      }

      if (audio.paused) {
        // Start silent and fade up so pressing play is never jarring.
        audio.volume = 0;
        await audio.play();
      }
      void fadeTo(TARGET_VOLUME, FADE_IN_MS);
      setSessionPlaybackState("playing");
    } catch (error) {
      // AbortError just means pause() interrupted a pending play().
      if (error instanceof DOMException && error.name === "AbortError") return;
      setHasError(true);
      setIsActive(false);
      setIsBuffering(false);
    }
  }, [fadeTo, setSessionPlaybackState]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (document.hidden) {
      stopNow();
      return;
    }

    setIsActive(false);
    void fadeTo(0, FADE_OUT_MS).then(() => audio.pause());
  }, [fadeTo, stopNow]);

  const togglePlay = useCallback(() => {
    if (isActive) {
      pause();
    } else {
      void play();
    }
  }, [isActive, pause, play]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const handleSeekChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      seekTo(Number(event.target.value));
    },
    [seekTo],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(MUTED_STORAGE_KEY, String(next));
      } catch {
        // Storage can be unavailable (private mode); muting still works.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Wire native audio events to UI state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlaying = () => {
      setIsBuffering(false);
      setHasError(false);
      setIsActive(true);
      setSessionPlaybackState("playing");
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePause = () => {
      setIsActive(false);
      setIsBuffering(false);
      setSessionPlaybackState("paused");
    };
    const handleEnded = () => {
      audio.currentTime = 0;
      setCurrentTime(0);
      setIsActive(false);
      setIsBuffering(false);
    };
    const handleError = () => {
      setHasError(true);
      setIsActive(false);
      setIsBuffering(false);
    };

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      cancelAnimationFrame(fadeFrameRef.current);
    };
  }, [setSessionPlaybackState]);

  // Lock-screen / media-key controls and track info.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const { mediaSession } = navigator;

    mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: artist ?? "Barbatuques",
      album: "Shadowrun FPS",
      artwork: [
        { src: PLAYER_ARTWORK_SRC, sizes: "512x512", type: "image/png" },
      ],
    });

    const audio = audioRef.current;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => void play()],
      // Must pause in this turn. A fade waits on animation frames that a
      // locked phone will not run until the page is opened again.
      ["pause", stopNow],
      ["stop", stopNow],
      [
        "seekbackward",
        () =>
          seekTo(Math.max((audio?.currentTime ?? 0) - SEEK_STEP_SECONDS, 0)),
      ],
      [
        "seekforward",
        () =>
          seekTo(
            Math.min(
              (audio?.currentTime ?? 0) + SEEK_STEP_SECONDS,
              audio?.duration ?? 0,
            ),
          ),
      ],
      [
        "seekto",
        (details) => {
          if (details.seekTime !== undefined) seekTo(details.seekTime);
        },
      ],
    ];

    for (const [action, handler] of handlers) {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Some browsers don't support every action; skip those.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {
          // Ignored: see above.
        }
      }
      mediaSession.metadata = null;
    };
  }, [artist, play, seekTo, stopNow, trackTitle]);

  // Keep the OS scrubber in sync with the real position.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: 1,
      });
    } catch {
      // Throws if position exceeds duration mid-seek; the next tick corrects it.
    }
  }, [currentTime, duration]);

  const playButtonLabel = hasError
    ? "Retry playing audio"
    : isActive
      ? "Pause audio"
      : "Play audio";

  const seekValueText = useMemo(
    () => `${formatTime(currentTime)} of ${formatTime(duration)}`,
    [currentTime, duration],
  );

  return (
    <div
      className={cn(
        "fixed z-50 border bg-background/95 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl",
        // Keep clear of the iPhone home bar and rounded screen corners.
        "bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] sm:bottom-6 sm:right-6",
        isExpanded
          ? "rounded-[1.75rem] p-2 sm:p-3"
          : "rounded-full p-1.5 sm:p-2",
        className,
      )}
    >
      {/* preload="none": nothing downloads until the first press */}
      <audio ref={audioRef} src={audioSrc} preload="none" />

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playButtonLabel}
          aria-busy={isBuffering}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 sm:h-12 sm:w-12"
        >
          <Image
            src={PLAYER_ARTWORK_SRC}
            alt=""
            width={48}
            height={48}
            className={cn(
              "h-full w-full rounded-full object-cover",
              isActive &&
                !isBuffering &&
                "motion-safe:animate-[spin_12s_linear_infinite]",
            )}
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white sm:h-7 sm:w-7">
              {isBuffering ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : isActive ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
            </span>
          </span>
        </button>

        {isExpanded ? (
          <>
            <div className="w-36 min-w-0 space-y-0.5 sm:w-48">
              <div className="truncate text-xs font-medium sm:text-sm">
                {trackTitle}
                {artist ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {artist}
                  </span>
                ) : null}
              </div>

              {hasError ? (
                <p role="alert" className="text-[11px] text-destructive">
                  Couldn&apos;t load the audio. Tap play to retry.
                </p>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-8 shrink-0 text-[10px] tabular-nums text-muted-foreground sm:text-xs">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={1}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={handleSeekChange}
                    disabled={!duration}
                    aria-label="Seek"
                    aria-valuetext={seekValueText}
                    className="h-6 min-w-0 flex-1 cursor-pointer accent-primary disabled:cursor-default"
                  />
                  <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground sm:text-xs">
                    {formatTime(duration)}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              aria-pressed={isMuted}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export const FloatingPlayer = memo(FloatingPlayerComponent);
