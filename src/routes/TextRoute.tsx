import { marked } from 'marked';
import about from '../../content/about.md?raw';
import projectsIndex from '../../content/projects.json';
import writingIndex from '../../content/writing.json';
import styles from './TextRoute.module.css';

const aboutHtml = marked.parse(about) as string;

// Eagerly import all project and writing markdown files
const projectFiles = import.meta.glob('/content/projects/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const writingFiles = import.meta.glob('/content/writing/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function TextRoute() {
  return (
    <main className={styles.main} tabIndex={0}>
      <header className={styles.header}>
        <h1 className={styles.title}>3am — a quant&rsquo;s workstation</h1>
        <p className={styles.eyebrow}>plain-text version</p>
        <a href="/" className={styles.backLink}>← Enter 3D Workstation</a>
      </header>

      <section
        className={styles.prose}
        dangerouslySetInnerHTML={{ __html: aboutHtml }}
      />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <div className={styles.list}>
          {projectsIndex.projects.map((project) => {
            const rawMarkdown = projectFiles[`/content/projects/${project.id}.md`] || '';
            const html = rawMarkdown ? marked.parse(rawMarkdown) : `<p>${project.thesis}</p>`;
            return (
              <article key={project.id} className={styles.item} id={`project-${project.id}`}>
                <div dangerouslySetInnerHTML={{ __html: html }} className={styles.prose} />
                {project.links && project.links.length > 0 && (
                  <div className={styles.links}>
                    {project.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.link}
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notebook</h2>
        <div className={styles.list}>
          {writingIndex.writing.map((piece) => {
            const rawMarkdown = writingFiles[`/content/writing/${piece.id}.md`] || '';
            const html = rawMarkdown ? marked.parse(rawMarkdown) : '';
            return (
              <article key={piece.id} className={styles.item} id={`writing-${piece.id}`}>
                <p className={styles.date}>{piece.date}</p>
                <div dangerouslySetInnerHTML={{ __html: html }} className={styles.prose} />
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 3am. Plain-text edition.</p>
      </footer>
    </main>
  );
}
