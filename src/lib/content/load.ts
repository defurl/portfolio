import { marked } from 'marked';
import projectsIndex from '../../../content/projects.json';
import writingIndex from '../../../content/writing.json';

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

export interface WritingIndexEntry {
  id: string;
  title: string;
  date: string;
}

// Non-eager globs — each value is a loader returning the raw markdown.
const projectBodies = import.meta.glob('/content/projects/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>;

const writingBodies = import.meta.glob('/content/writing/*.md', {
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
  const loader = projectBodies[`/content/projects/${id}.md`];
  if (!loader) return '<p>Body unavailable.</p>';
  const raw = await loader();
  return marked.parse(raw) as string;
}

/** Synchronous — the writing index. */
export function getWritingIndex(): WritingIndexEntry[] {
  return writingIndex.writing as WritingIndexEntry[];
}

/** Async — resolves to rendered HTML for a writing piece's markdown body. */
export async function loadWritingBody(id: string): Promise<string> {
  const loader = writingBodies[`/content/writing/${id}.md`];
  if (!loader) return '<p>Body unavailable.</p>';
  const raw = await loader();
  return marked.parse(raw) as string;
}
