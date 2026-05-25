import { useEffect } from 'react';
import { createMarketOrchestrator } from '../../lib/data/orchestrator';
import { getSession } from '../../lib/data/clock';
import { useMarketStore } from '../../lib/stores/marketStore';
import { useInteractionStore, type ObjectId } from '../../lib/stores/interactionStore';

// DeskData — wires the MarketOrchestrator into marketStore for the lifetime
// of DeskRoute. Renders nothing. Single composition point so the orchestrator
// stays decoupled from Zustand and from React.

const SESSION_POLL_MS = 60_000;

export function DeskData() {
  useEffect(() => {
    const orch = createMarketOrchestrator();
    const { applyTick, applyIndex, setStatus, setSession } = useMarketStore.getState();

    const offTick = orch.onTick(applyTick);
    const offIndex = orch.onIndex(applyIndex);
    const offStatus = orch.onStatus(setStatus);

    setSession(getSession());
    const sessionTimer = setInterval(() => setSession(getSession()), SESSION_POLL_MS);

    void orch.start();

    // Dev-only hooks for visual/audio verification. Stripped from prod
    // (`import.meta.env.DEV` is statically false → dead-code elimination).
    // Phase-agnostic `__market` namespace so City and NN can add hooks here
    // without re-namespacing each phase.
    if (import.meta.env.DEV) {
      const w = window as unknown as { __market?: Record<string, unknown> };
      const ns: Record<string, unknown> = w.__market ?? {};
      ns.setSession = (s: Parameters<typeof setSession>[0]) => setSession(s);
      ns.focus = (id: ObjectId | null) => {
        const is = useInteractionStore.getState();
        if (id === null) is.returnToDesk();
        else is.focusObject(id, null);
      };
      ns.setDirection = (dir: 'up' | 'flat' | 'down') => {
        const cur = useMarketStore.getState().index;
        applyIndex({
          spy: cur?.spy ?? 530,
          qqq: cur?.qqq ?? 458,
          vix: cur?.vix ?? 14,
          direction: dir,
          ts: Date.now(),
        });
      };
      ns.setVix = (vix: number) => {
        const cur = useMarketStore.getState().index;
        applyIndex({
          spy: cur?.spy ?? 530,
          qqq: cur?.qqq ?? 458,
          vix,
          direction: cur?.direction ?? 'flat',
          ts: Date.now(),
        });
      };
      w.__market = ns;
    }

    return () => {
      clearInterval(sessionTimer);
      offTick();
      offIndex();
      offStatus();
      orch.stop();
    };
  }, []);

  return null;
}
