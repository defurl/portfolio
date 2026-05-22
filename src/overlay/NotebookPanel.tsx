import { useState } from 'react';
import { useInteractionStore } from '../lib/stores/interactionStore';
import { getWritingIndex, loadWritingBody, type WritingIndexEntry } from '../lib/content/load';
import { ScenePanel } from './ScenePanel';
import styles from './ProjectPanel.module.css';

// Notebook → writing (1.16). Same list/body pattern as the ProjectPanel,
// reusing its stylesheet — these two panels are visually the same shape.

export function NotebookPanel() {
  const panel = useInteractionStore(s => s.panel);
  const returnToDesk = useInteractionStore(s => s.returnToDesk);
  const open = panel === 'notebook';

  const pieces = getWritingIndex();
  const [openId, setOpenId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const openPiece = async (p: WritingIndexEntry) => {
    setOpenId(p.id);
    setLoading(true);
    setBody('');
    setBody(await loadWritingBody(p.id));
    setLoading(false);
  };

  const backToList = () => {
    setOpenId(null);
    setBody('');
  };

  const close = () => {
    backToList();
    returnToDesk();
  };

  const active = pieces.find(p => p.id === openId) ?? null;

  return (
    <ScenePanel open={open} eyebrow="notebook" onClose={close}>
      {active ? (
        <article>
          <button type="button" className={styles.back} onClick={backToList}>
            ← back to list
          </button>
          {loading ? (
            <p className={styles.loading}>loading…</p>
          ) : (
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </article>
      ) : (
        <ul className={styles.list}>
          {pieces.map(p => (
            <li key={p.id}>
              <button type="button" className={styles.entry} onClick={() => openPiece(p)}>
                <span className={styles.title}>{p.title}</span>
                <span className={styles.thesis}>{p.date}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ScenePanel>
  );
}
