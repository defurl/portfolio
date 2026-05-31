// Phase 4D — designates one ML-district building as the "Neural Gateway"
// portal into Layer 3. The chosen id is the deepest ML repo by commit
// count (resolves to Intel-TradingAgent in the current data; falls back
// to the first ML building if that id isn't present).

import { getCityBuildings } from '../../lib/content/buildings';

let cached: string | null | undefined;

export function neuralGatewayId(): string | null {
  if (cached !== undefined) return cached;
  const m = getCityBuildings();
  const candidates = m.buildings.filter((b) => b.district === 'ml');
  if (candidates.length === 0) {
    cached = null;
    return null;
  }
  // Prefer the explicit Intel-TradingAgent — owner's deep ML repo.
  const preferred = candidates.find((b) => b.id === 'defurl/Intel-TradingAgent');
  cached = (preferred ?? candidates.sort((a, b) => b.commits - a.commits)[0]!).id;
  return cached;
}
