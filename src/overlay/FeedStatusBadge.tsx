import { useMarketStore } from '../lib/stores/marketStore';
import { useInteractionStore } from '../lib/stores/interactionStore';
import styles from './FeedStatusBadge.module.css';

// Feed status badge — visible when the data spine is in replay mode.
// Hidden when status is 'live'; shows a small honesty signal otherwise.
//
// Corner allocation: bottom-left, sits above BackToDesk. Fades to 0 opacity
// when a panel is focused so the navigation affordance and panel get priority.
export function FeedStatusBadge() {
  const status = useMarketStore((s) => s.status);
  const focused = useInteractionStore((s) => s.focus !== null);

  if (status.kind === 'live') return null;

  const label =
    status.kind === 'replay'
      ? `· replay · ${status.datasetDate}`
      : status.kind === 'rest'
        ? `· rest · ${status.source}`
        : `· offline`;

  const tooltip =
    status.kind === 'replay'
      ? `Market data is a replay of ${status.datasetDate}. The city still breathes.`
      : 'The data spine is offline. The scene continues without it.';

  return (
    <div
      className={styles.badge}
      data-focused={focused ? 'true' : 'false'}
      tabIndex={0}
      aria-label={tooltip}
    >
      {label}
      <span className={styles.tooltip}>{tooltip}</span>
    </div>
  );
}
