import type { MatchMapOption } from "@/types";

interface MapCatalogEntry extends MatchMapOption {
  aliases: string[];
}

const MAP_CATALOG: MapCatalogEntry[] = [
  { id: "favela", name: "Favela", image: "/maps/map_favela.png", aliases: ["favela"] },
  {
    id: "maelstrom",
    name: "Maelstrom",
    image: "/maps/map_maelstrom.png",
    aliases: ["maelstrom"],
  },
  {
    id: "nerve-center",
    name: "Nerve Center",
    image: "/maps/map_nervecenter.png",
    aliases: ["nerve center"],
  },
  {
    id: "nerve-center-small",
    name: "Nerve Center (Small)",
    image: "/maps/map_nervecenter.png",
    aliases: ["nerve center (small)", "nerve center small"],
  },
  {
    id: "pinnacle",
    name: "Pinnacle",
    image: "/maps/map_pinnacle.png",
    aliases: ["pinnacle"],
  },
  { id: "poco", name: "Poco", image: "/maps/map_poco.png", aliases: ["poco"] },
  {
    id: "power-station",
    name: "Power Station",
    image: "/maps/map_powerstation.png",
    aliases: ["power station"],
  },
  {
    id: "temple-grounds",
    name: "Temple Grounds",
    image: "/maps/map_templegrounds.png",
    aliases: ["temple grounds"],
  },
  {
    id: "dig-site",
    name: "Dig Site",
    image: "/maps/map_digsite.png",
    aliases: ["dig site"],
  },
  {
    id: "lobby",
    name: "Lobby",
    image: "/maps/map_lobby.png",
    aliases: ["lobby"],
  },
  {
    id: "lobby-small",
    name: "Lobby (Small)",
    image: "/maps/map_lobby.png",
    aliases: ["lobby (small)", "lobby small"],
  },
];

function slugMapId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "unknown";
}

/** Resolve an export map name to a stable id and optional thumbnail. */
export function resolveRankedMap(rawName: string): MatchMapOption {
  const normalized = rawName.trim().toLowerCase();
  const known = MAP_CATALOG.find(
    (entry) =>
      entry.aliases.includes(normalized) || entry.name.toLowerCase() === normalized,
  );
  if (known) {
    return { id: known.id, name: known.name, image: known.image };
  }

  const id = slugMapId(rawName);
  const byId = MAP_CATALOG.find((entry) => entry.id === id);
  if (byId) {
    return { id: byId.id, name: byId.name, image: byId.image };
  }

  return { id, name: rawName.trim() || "Unknown", image: null };
}
