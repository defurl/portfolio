import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { ScenePanel } from './ScenePanel';
import { useCityStore } from '../lib/stores/cityStore';
import { getCityBuildings, type BuildingData } from '../lib/content/buildings';
import projectStyles from './ProjectPanel.module.css';

// Building panel — opens on city building click. Reuses ScenePanel shell
// (same slide-in mechanics as the desk's ProjectPanel) and the
// ProjectPanel.module.css typography so the look matches the desk panel.
//
// Content (per phase-3-prompt.md §3.22):
//   - title: <repo-name> (Fraunces italic, step-3)
//   - description from GitHub
//   - stats row: <additions> LOC · <commits> commits · <language> · last push
//   - README (lazy-fetched on open; fallback "// readme unavailable")
//   - `view on github →` link

function relativeFrom(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.round(ms / 86_400_000);
  if (d < 1) return 'today';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.round(d / 30)}mo ago`;
  return `${Math.round(d / 365)}y ago`;
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function CityBuildingPanel() {
  const focus = useCityStore((s) => s.focus);
  // Closing a building panel returns to the parent district, not all the
  // way to overview — preserves the user's exploration depth.
  const back = useCityStore((s) => s.backToDistrict);

  const buildingId = focus.mode === 'building' ? focus.buildingId : null;
  const data: BuildingData | undefined = useMemo(() => {
    if (!buildingId) return undefined;
    return getCityBuildings().buildings.find((b) => b.id === buildingId);
  }, [buildingId]);

  const [readmeHtml, setReadmeHtml] = useState<string | null>(null);
  const [readmeError, setReadmeError] = useState(false);

  // Lazy-fetch README on building change.
  useEffect(() => {
    if (!data) {
      setReadmeHtml(null);
      setReadmeError(false);
      return;
    }
    let cancelled = false;
    setReadmeHtml(null);
    setReadmeError(false);
    fetch(`https://api.github.com/repos/${data.id}/readme`, {
      headers: { Accept: 'application/vnd.github.raw' },
    })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((md) => {
        if (cancelled) return;
        // Trim long READMEs to ~6kb so the panel isn't a wall of text.
        const truncated = md.length > 6000 ? md.slice(0, 6000) + '\n\n*(truncated)*' : md;
        setReadmeHtml(marked.parse(truncated) as string);
      })
      .catch(() => {
        if (cancelled) return;
        setReadmeError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (!data) return <ScenePanel open={false} eyebrow="" onClose={back}><></></ScenePanel>;

  const lastPush = relativeFrom(data.pushedAt);
  const eyebrow = `// ${data.district}`;

  return (
    <ScenePanel open onClose={back} eyebrow={eyebrow}>
      <h2 className={projectStyles.title}>{data.name}</h2>
      {data.description && <p className={projectStyles.thesis}>{data.description}</p>}
      <p className={projectStyles.loading}>
        {compactNumber(data.additions)} LOC · {data.commits} commits · {data.primaryLanguage} · last push {lastPush}
        {data.archived ? ' · archived' : ''}
      </p>
      <div className={projectStyles.prose} style={{ marginTop: '1.25rem' }}>
        {readmeHtml ? (
          <div dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        ) : readmeError ? (
          <p className={projectStyles.loading}>{'// readme unavailable'}</p>
        ) : (
          <p className={projectStyles.loading}>{'// loading readme…'}</p>
        )}
      </div>
      <ul className={projectStyles.links}>
        <li>
          <a href={data.url} target="_blank" rel="noreferrer">
            view on github →
          </a>
        </li>
      </ul>
    </ScenePanel>
  );
}
