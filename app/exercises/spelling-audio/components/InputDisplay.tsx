"use client";

import type { GameStatus } from "../hooks/useSpellingGame";
import styles from "../styles.module.css";

type InputDisplayProps = {
  value: string[];
  targetLength: number;
  status: GameStatus;
  shouldShake: boolean;
  onAnimationEnd: () => void;
};

export function InputDisplay({
  value,
  targetLength,
  status,
  shouldShake,
  onAnimationEnd,
}: InputDisplayProps) {
  const classNames = [styles.inputField];

  if (status === "success") {
    classNames.push(styles.inputFieldSuccess);
  }
  if (status === "error") {
    classNames.push(styles.inputFieldError);
  }
  if (shouldShake) {
    classNames.push(styles.inputFieldShake);
  }

  return (
    <div className={styles.inputWrapper}>
      <div
        role="textbox"
        aria-readonly="true"
        aria-live="polite"
        className={classNames.join(" ")}
        onAnimationEnd={onAnimationEnd}
      >
        {value.join("")}
      </div>
      <span className={styles.inputCounter} aria-hidden="true">
        {value.length} / {targetLength}
      </span>
    </div>
  );
}

