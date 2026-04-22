import { Chip } from "./Chip";
import type { ChipTint } from "./Chip";

const map: Record<string, { label: string; tint: ChipTint }> = {
  common:    { label: "Common",    tint: "neutral" },
  rare:      { label: "Rare",      tint: "reserve" },
  legendary: { label: "Legendary", tint: "amber" },
  mythic:    { label: "Mythic",    tint: "violet" },
};

export function RarityBadge({ rarity }: { rarity: string }) {
  const r = map[rarity] ?? map.common!;
  return <Chip tint={r.tint}>★ {r.label}</Chip>;
}
