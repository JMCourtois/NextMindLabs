import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

export default function ExercisesLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Übungen</p>
          <h1 className={styles.title}>Sprach- und Hörtraining</h1>
        </div>
        <Link href="/" className={styles.backLink}>
          ← Zur Übersicht
        </Link>
      </header>

      <main id="mainContent" className={styles.main}>
        {children}
      </main>
    </div>
  );
}

