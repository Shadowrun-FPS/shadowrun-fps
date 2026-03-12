"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPlayerProps {
  audioSrc: string;
  trackTitle?: string;
  className?: string;
  isPlaying?: boolean;
  setIsPlaying?: (playing: boolean) => void;
  onAudioRef?: (audio: HTMLAudioElement | null) => void;
  duration?: number; // Custom duration in seconds
}

export function FloatingPlayer({
  audioSrc,
  trackTitle = "Show Me The Way",
  className,
  isPlaying: externalIsPlaying,
  setIsPlaying: externalSetIsPlaying,
  onAudioRef,
  duration: customDuration,
}: FloatingPlayerProps) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use external state if provided, otherwise use internal state
  const isPlaying =
    externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const setIsPlaying = externalSetIsPlaying || setInternalIsPlaying;

  // Auto-expand when playing, collapse when not playing
  const isExpanded = isPlaying;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Provide audio ref to parent component if callback is provided
    if (onAudioRef) {
      onAudioRef(audio);
    }

    // Set initial volume
    audio.volume = 1; // Default volume

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      // Use custom duration if provided, otherwise use audio duration
      const audioDuration = customDuration || audio.duration;
      setDuration(audioDuration);
    };
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Set custom duration immediately if provided
    if (customDuration) {
      setDuration(customDuration);
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      if (onAudioRef) {
        onAudioRef(null);
      }
    };
  }, [onAudioRef, setIsPlaying, customDuration]);

  // Sync external play state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audio.paused) {
      audio.play();
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-50 rounded-full border shadow-lg backdrop-blur-sm transition-all duration-300 bg-background/95 hover:shadow-xl",
        isExpanded ? "p-2.5 sm:p-4" : "p-2 sm:p-3",
        className
      )}
    >
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      <div
        className={cn(
          "flex items-center transition-all duration-300",
          isExpanded ? "space-x-1.5 sm:space-x-3" : "space-x-1 sm:space-x-2"
        )}
      >
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary/10 hover:bg-primary/20"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-6 sm:h-6" />
          ) : (
            <Play className="ml-0.5 sm:ml-1 w-4 h-4 sm:w-6 sm:h-6" />
          )}
        </Button>

        {/* Track Info & Progress - Only show when expanded (playing) */}
        {isExpanded && (
          <div className="flex-col space-y-0.5 sm:space-y-1 min-w-0 sm:flex">
            <div className="text-[11px] sm:text-sm font-medium truncate max-w-20 sm:max-w-32">
              {trackTitle}
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-0.5 sm:h-1 rounded-full bg-muted min-w-12 sm:min-w-16">
                <div
                  className="h-0.5 sm:h-1 rounded-full transition-all duration-300 bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        {/* Volume Control - Only show when expanded (playing) */}
        {isExpanded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full sm:flex min-w-6 min-h-6"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
