import about from '../../content/about.md?raw';
import { useInteractionStore } from '../lib/stores/interactionStore';
import { useSceneStore } from '../lib/stores/sceneStore';
import { getActivity } from '../lib/content/activity';
import { ScenePanel } from './ScenePanel';
import styles from './TerminalPanel.module.css';

// Monitor 2 → terminal (1.15). Build-time GitHub activity + a quiet bio.

// First ~80 words of about.md, markdown stripped — the quiet bio line.
const BIO = about
  .replace(/^#.*$/gm, '')
  .replace(/[#*`>_-]/g, '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 80)
  .join(' ');

function timestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '——';
  return d.toISOString().slice(5, 16).replace('T', ' ');
}

function truncate(s: string, n: number): string {
  const oneLine = s.split('\n')[0];
  return oneLine.length > n ? oneLine.slice(0, n - 1) + '…' : oneLine;
}

export function TerminalPanel() {
  const panel = useInteractionStore(s => s.panel);
  const returnToDesk = useInteractionStore(s => s.returnToDesk);
  const reduced = useSceneStore(s => s.prefersReducedMotion);
  const isMobile = useSceneStore(s => s.isMobile);
  const open = panel === 'terminal';
  // Rolling-scroll disabled on mobile (1.21) and under reduced motion.
  const scrollEnabled = !reduced && !isMobile;

  const activity = getActivity();
  const hasItems = activity.items.length > 0;

  return (
    <ScenePanel open={open} eyebrow="terminal" onClose={returnToDesk}>
      <p className={styles.header}>{'// defurl — last 7 days'}</p>

      {hasItems ? (
        <ul
          className={styles.log}
          data-scroll={scrollEnabled}
        >
          {activity.items.map((it, i) => (
            <li key={`${it.ts}-${i}`} className={styles.row}>
              <span className={styles.ts}>{timestamp(it.ts)}</span>
              <span className={styles.repo}>{it.repo}</span>
              <span className={styles.msg}>{truncate(it.message, 80)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>
          {activity.source === 'stub'
            ? '// activity unavailable at build time'
            : '// no public activity in the last 7 days'}
        </p>
      )}

      <p className={styles.bio}>{BIO}</p>
    </ScenePanel>
  );
}
