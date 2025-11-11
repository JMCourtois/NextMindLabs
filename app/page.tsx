import Link from "next/link";
import styles from "./page.module.css";

const exercises = [
  {
    slug: "spelling-audio",
    href: "/exercises/spelling-audio",
    title: "100 Fehlerwörter",
    description: "Höre dir das Wort an, ordne die Buchstaben und überprüfe deine Antwort.",
    badge: "Audio + Buchstaben",
  },
];

export default function HomePage() {
  return (
    <main id="mainContent" className={styles.main}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>NextMind Labs</p>
        <h1 className={styles.title}>Lernübungen für clevere Kids</h1>
        <p className={styles.subtitle}>
          Wähle eine Übung aus und starte direkt im Browser – keine Anmeldung nötig.
        </p>
      </section>

      <section aria-label="Verfügbare Übungen">
        <ul className={styles.cardGrid}>
          {exercises.map((exercise) => (
            <li key={exercise.slug} className={styles.cardItem}>
              <Link
                href={exercise.href}
                className={styles.cardLink}
                aria-label={`${exercise.title} öffnen`}
              >
                <span className={styles.cardBadge}>{exercise.badge}</span>
                <h2 className={styles.cardTitle}>{exercise.title}</h2>
                <p className={styles.cardDescription}>{exercise.description}</p>
                <span className={styles.cardCta} aria-hidden="true">
                  Übung öffnen →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
