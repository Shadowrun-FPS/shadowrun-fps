"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { namesMatch } from "@/lib/leaderboard-stats";
import { PLAYER_ID_PATTERN } from "@/lib/rivals/config";
import { uniquePlayerByNames } from "@/lib/rivals/identity";
import {
  emptyRivalsPreference,
  mergeRivalsPreferences,
  readRivalsPreference,
  sanitizeRivalsPreference,
  writeRivalsPreference,
} from "@/lib/rivals/preferences";
import type { RivalsPreference, SeenSnapshot } from "@/types/rivals";

interface NamedPlayer {
  id: string;
  name: string;
}

interface UserDataResponse {
  rivalsPreference?: unknown;
}

function discordNames(user: { nickname?: string | null; name?: string | null } | undefined) {
  return [user?.nickname, user?.name];
}

export function useRivalsPreference(players: NamedPlayer[], urlPlayerId: string | null) {
  const { data: session, status } = useSession();
  const [preference, setPreference] = useState<RivalsPreference>(emptyRivalsPreference);
  const [hydrated, setHydrated] = useState(false);
  const [discordMatched, setDiscordMatched] = useState(false);
  const baselines = useRef<Record<string, SeenSnapshot | null>>({});
  const lastSynced = useRef("");
  const playersRef = useRef(players);
  const sessionRef = useRef(session);
  const urlPlayerRef = useRef(urlPlayerId);
  const started = useRef(false);
  playersRef.current = players;
  sessionRef.current = session;
  urlPlayerRef.current = urlPlayerId;

  useEffect(() => {
    if (status === "loading" || started.current) return;
    started.current = true;
    let cancelled = false;

    async function hydrate() {
      const local = readRivalsPreference();
      let account: RivalsPreference | null = null;
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/user/data", { cache: "no-store" });
          if (response.ok) {
            const body = (await response.json()) as UserDataResponse;
            account = sanitizeRivalsPreference(body.rivalsPreference);
          }
        } catch {
          account = null;
        }
      }
      if (cancelled) return;

      let next = mergeRivalsPreferences(local, account);

      const requestedId = urlPlayerRef.current;
      const requested =
        requestedId && PLAYER_ID_PATTERN.test(requestedId)
          ? requestedId.toLowerCase()
          : null;
      let matched = false;
      if (requested && playersRef.current.some((player) => player.id === requested)) {
        next = { ...next, selectedPlayerId: requested };
      } else if (status === "authenticated") {
        const match = uniquePlayerByNames(
          playersRef.current,
          discordNames(sessionRef.current?.user),
        );
        if (match) {
          matched = next.selectedPlayerId !== match.id;
          next = { ...next, selectedPlayerId: match.id };
        }
      }

      baselines.current = { ...next.lastSeenByPlayer };
      lastSynced.current = JSON.stringify(account ?? emptyRivalsPreference());
      writeRivalsPreference(next);
      setDiscordMatched(matched);
      setPreference(next);
      setHydrated(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    const body = JSON.stringify(preference);
    if (body === lastSynced.current) return;
    const timeout = window.setTimeout(() => {
      lastSynced.current = body;
      void fetch("/api/user/rivals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => {
        lastSynced.current = "";
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [hydrated, preference, status]);

  const update = useCallback((recipe: (current: RivalsPreference) => RivalsPreference) => {
    setPreference((current) => {
      const next = recipe(current);
      writeRivalsPreference(next);
      return next;
    });
  }, []);

  const setSelectedPlayerId = useCallback(
    (playerId: string | null) => {
      setDiscordMatched(false);
      update((current) => ({ ...current, selectedPlayerId: playerId }));
    },
    [update],
  );

  const togglePin = useCallback(
    (pairKey: string) => {
      update((current) => {
        const pinned = current.pinnedPairKeys.includes(pairKey)
          ? current.pinnedPairKeys.filter((key) => key !== pairKey)
          : [...current.pinnedPairKeys, pairKey].slice(-20);
        return { ...current, pinnedPairKeys: pinned };
      });
    },
    [update],
  );

  const baselineFor = useCallback(
    (playerId: string): SeenSnapshot | null | undefined => {
      if (!hydrated) return undefined;
      if (!(playerId in baselines.current)) baselines.current[playerId] = null;
      return baselines.current[playerId];
    },
    [hydrated],
  );

  const rememberSeen = useCallback((playerId: string, seen: SeenSnapshot) => {
    update((current) => {
      const existing = current.lastSeenByPlayer[playerId];
      if (existing && JSON.stringify(existing) === JSON.stringify(seen)) return current;
      return {
        ...current,
        lastSeenByPlayer: { ...current.lastSeenByPlayer, [playerId]: seen },
      };
    });
  }, [update]);

  const viewerImage =
    session?.user?.image &&
    preference.selectedPlayerId &&
    players.some(
      (player) =>
        player.id === preference.selectedPlayerId &&
        discordNames(session.user).some((label) => namesMatch(player.name, label)),
    )
      ? session.user.image
      : null;

  return {
    preference,
    hydrated,
    discordMatched,
    setSelectedPlayerId,
    togglePin,
    baselineFor,
    rememberSeen,
    viewerImage,
  };
}
