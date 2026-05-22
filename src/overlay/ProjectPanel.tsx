import { useState } from 'react';
import { useInteractionStore } from '../lib/stores/interactionStore';
import { getProjectIndex, loadProjectBody, type ProjectIndexEntry } from '../lib/content/load';
import { ScenePanel } from './ScenePanel';
import styles from './ProjectPanel.module.css';

// Monitor 1 → projects (Checkpoint B 1.14). Driven by content/projects.json;
// per-project markdown bodies load on demand via loadProjectBody.
// Two views inside one panel: the project LIST, and a single project BODY.

export function ProjectPanel() {
  const panel = useInteractionStore(s => s.panel);
  const returnToDesk = useInteractionStore(s => s.returnToDesk);
  const open = panel === 'projects';

  const projects = getProjectIndex();
  const [openId, setOpenId] = useState<string | null>(null);
  const [body, setBody] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const openProject = async (p: ProjectIndexEntry) => {
    setOpenId(p.id);
    setLoading(true);
    setBody('');
    const html = await loadProjectBody(p.id);
    setBody(html);
    setLoading(false);
  };

  const backToList = () => {
    setOpenId(null);
    setBody('');
  };

  // Closing the panel resets it to the list view for next time.
  const close = () => {
    backToList();
    returnToDesk();
  };

  const active = projects.find(p => p.id === openId) ?? null;

  return (
    <ScenePanel open={open} eyebrow="projects" onClose={close}>
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
              // Body HTML is built at our own build time from our own
              // markdown — not user input. Safe to inject.
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
          {active.links.length > 0 && (
            <ul className={styles.links}>
              {active.links.map(l => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noreferrer noopener">
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : (
        <ul className={styles.list}>
          {projects.map(p => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.entry}
                onClick={() => openProject(p)}
              >
                <span className={styles.title}>{p.title}</span>
                <span className={styles.thesis}>{p.thesis}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ScenePanel>
  );
}
