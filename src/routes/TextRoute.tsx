import { marked } from 'marked';
import about from '../../content/about.md?raw';
import styles from './TextRoute.module.css';

const aboutHtml = marked.parse(about) as string;

// /text — accessible, no-WebGL, no-audio fallback.
// Proof-of-pipeline: renders content/about.md at build time.
export function TextRoute() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>3am — a quant&rsquo;s workstation</h1>
        <p className={styles.eyebrow}>plain-text version</p>
      </header>
      <section
        className={styles.prose}
        dangerouslySetInnerHTML={{ __html: aboutHtml }}
      />
    </main>
  );
}
