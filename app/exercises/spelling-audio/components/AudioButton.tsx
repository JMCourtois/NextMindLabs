"use client";

import { useMemo } from "react";
import styles from "../styles.module.css";

type AudioButtonProps = {
  onPlay: () => void;
  disabled?: boolean;
  busy?: boolean;
  available?: boolean;
};

export function AudioButton({
  onPlay,
  disabled = false,
  busy = false,
  available = true,
}: AudioButtonProps) {
  const ariaLabel = useMemo(
    () => (available ? "Wort anhören" : "Audio nicht verfügbar"),
    [available],
  );

  return (
    <button
      type="button"
      className={styles.audioButton}
      onClick={onPlay}
      disabled={disabled || !available}
      aria-label={ariaLabel}
      aria-live="polite"
      aria-busy={busy}
      title={ariaLabel}
    >
      <svg
        className={styles.audioButtonIcon}
        aria-hidden="true"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20.3 9.4 11 16H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5l9.3 6.6a2 2 0 0 0 3.2-1.6V11a2 2 0 0 0-3.2-1.6ZM18 16.8v14.4L12.8 28H8v-8h4.8ZM31.7 12.3a2 2 0 1 0-3.4 2c2 3.3 2 8.4 0 11.7a2 2 0 1 0 3.4 2c3-5 3-10.7 0-15.7Zm6.6-5.5a2 2 0 0 0-3.4 2c4.3 7.2 4.3 18 0 25.2a2 2 0 0 0 3.4 2c5-8.4 5-20.8 0-29.2Z" />
      </svg>
      <span className={styles.audioButtonLabel}>{available ? "Anhören" : "Kein Audio"}</span>
    </button>
  );
}

