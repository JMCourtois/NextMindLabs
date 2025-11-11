"use client";

import styles from "../styles.module.css";

type LetterGridProps = {
  letters: string[];
  disabled?: boolean;
  onSelect: (letter: string) => void;
};

export function LetterGrid({ letters, disabled = false, onSelect }: LetterGridProps) {
  return (
    <div
      className={`${styles.letterGrid}${disabled ? ` ${styles.letterGridLocked}` : ""}`}
      role="group"
      aria-label="Buchstaben auswählen"
    >
      {letters.map((letter, index) => (
        <button
          key={`${letter}-${index}`}
          type="button"
          className={styles.letterButton}
          onClick={() => onSelect(letter)}
          disabled={disabled}
          aria-label={`Buchstabe ${letter}`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}

