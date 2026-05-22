import { marked } from 'marked';
import projectsIndex from '../../../content/projects.json';

// Content loader (architecture §8, B3 lazy strategy).
// - The project INDEX (id/title/category/district/thesis/links) is a small
//   JSON imported eagerly — it's what the ProjectPanel list needs up front.
// - Project BODIES (the markdown) load on demand via a non-eager glob, so a
//   ten-project portfolio doesn't ship ten markdown files in the entry chunk.

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectIndexEntry {
  id: string;
  title: string;
  category: string;
  district: string;
  thesis: string;
  links: ProjectLink[];
}

// Non-eager glob — each value is a loader function returning the raw markdown.
const bodyLoaders = import.meta.glob('/content/projects/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>;

/** Synchronous — the index is available immediately. */
export function getProjectIndex(): ProjectIndexEntry[] {
  return projectsIndex.projects as ProjectIndexEntry[];
}

/** Async — resolves to rendered HTML for the project's markdown body. */
export async function loadProjectBody(id: string): Promise<string> {
  const loader = bodyLoaders[`/content/projects/${id}.md`];
  if (!loader) return '<p>Body unavailable.</p>';
  const raw = await loader();
  return marked.parse(raw) as string;
}
