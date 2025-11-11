"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedbackTone } from "@/lib/types";
import { safeAudioPlay } from "@/lib/utils";
import { AudioButton } from "./components/AudioButton";
import { InputDisplay } from "./components/InputDisplay";
import { LetterGrid } from "./components/LetterGrid";
import {
  useSpellingGame,
  type GameStatus,
} from "./hooks/useSpellingGame";
import styles from "./styles.module.css";

export default function SpellingAudioPage() {
  const {
    loading,
    loadError,
    currentWord,
    currentIndex,
    totalWords,
    letterPool,
    userInput,
    status,
    feedback,
    isLocked,
    showNextPrompt,
    audioAvailable,
    shouldShake,
    selectLetter,
    removeLetter,
    clearInput,
    checkAnswer,
    goToNextWord,
    acknowledgeShake,
    markAudioUnavailable,
    resetAudioAvailability,
    isValidLetter,
  } = useSpellingGame();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioBusy, setIsAudioBusy] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !currentWord) {
      return;
    }
    audioRef.current.src = currentWord.audioUrl;
    audioRef.current.load();
    setIsAudioBusy(false);
    resetAudioAvailability();
  }, [currentWord, resetAudioAvailability]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) {
      return;
    }

    function handleFinished() {
      setIsAudioBusy(false);
    }

    function handleError() {
      setIsAudioBusy(false);
      markAudioUnavailable();
    }

    element.addEventListener("ended", handleFinished);
    element.addEventListener("pause", handleFinished);
    element.addEventListener("error", handleError);

    return () => {
      element.removeEventListener("ended", handleFinished);
      element.removeEventListener("pause", handleFinished);
      element.removeEventListener("error", handleError);
    };
  }, [markAudioUnavailable]);

  const handlePlay = async () => {
    if (!audioRef.current || !audioAvailable) {
      return;
    }
    setIsAudioBusy(true);
    const success = await safeAudioPlay(audioRef.current);
    if (!success) {
      setIsAudioBusy(false);
      markAudioUnavailable();
    }
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!currentWord) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        removeLetter();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearInput();
        return;
      }

      if (event.key.length === 1 && isValidLetter(event.key)) {
        event.preventDefault();
        const lowerKey = event.key.toLowerCase();
        const matchedLetter =
          letterPool.find((letter) => letter.toLowerCase() === lowerKey) ?? event.key;
        selectLetter(matchedLetter);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [checkAnswer, clearInput, currentWord, isValidLetter, letterPool, removeLetter, selectLetter]);

  const progressLabel = useMemo(() => {
    if (!totalWords) {
      return "Wörter werden geladen …";
    }
    return `Wort ${currentIndex + 1} von ${totalWords}`;
  }, [currentIndex, totalWords]);

  if (loading) {
    return (
      <section className={styles.page}>
        <p className={styles.statusInfo} aria-live="polite">
          Wörter werden geladen …
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className={styles.page}>
        <p className={styles.statusError} role="alert">
          {loadError}
        </p>
      </section>
    );
  }

  if (!currentWord) {
    return (
      <section className={styles.page}>
        <p className={styles.statusError} role="alert">
          Keine Wörter gefunden. Bitte überprüfe die Datei <code>/public/data/words.json</code>.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="spellingAudioHeading">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.progress} aria-live="polite">
            {progressLabel}
          </p>
          <h2 id="spellingAudioHeading" className={styles.heading}>
            Höre das Wort – baue es mit Buchstaben nach
          </h2>
        </div>
        <AudioButton
          onPlay={handlePlay}
          disabled={isAudioBusy}
          busy={isAudioBusy}
          available={audioAvailable}
        />
      </header>

      <section className={styles.wordSection} aria-labelledby="wordPrompt">
        <p id="wordPrompt" className={styles.prompt}>
          Baue das Wort:
        </p>
        <InputDisplay
          value={userInput}
          targetLength={currentWord.word.length}
          status={status}
          shouldShake={shouldShake}
          onAnimationEnd={acknowledgeShake}
        />
        {currentWord.hints?.tip ? (
          <p className={styles.hint} aria-live="polite">
            Tipp: {currentWord.hints.tip}
          </p>
        ) : (
          <span aria-hidden="true" className={styles.hintPlaceholder}>
            &nbsp;
          </span>
        )}
      </section>

      <LetterGrid letters={letterPool} disabled={isLocked} onSelect={selectLetter} />

      <div className={styles.controls} role="group" aria-label="Aktionen">
        <button
          type="button"
          className={styles.controlButtonSecondary}
          onClick={removeLetter}
          disabled={isLocked || userInput.length === 0}
          aria-label="Letzten Buchstaben löschen"
        >
          ⌫ Rückgängig
        </button>
        <button
          type="button"
          className={styles.controlButtonPrimary}
          onClick={checkAnswer}
          disabled={isLocked}
        >
          Antwort prüfen
        </button>
        <button
          type="button"
          className={styles.controlButtonSecondary}
          onClick={clearInput}
          disabled={isLocked || userInput.length === 0}
          aria-label="Eingabe zurücksetzen"
        >
          ↺ Löschen
        </button>
      </div>

      <div
        className={`${styles.feedback} ${toneClass(status, feedback.tone)}`}
        aria-live="polite"
      >
        {feedback.message || " "}
      </div>

      {showNextPrompt ? (
        <div className={styles.nextPrompt} role="status" aria-live="polite">
          <p className={styles.nextPromptText}>Super! Bereit für das nächste Wort?</p>
          <button type="button" className={styles.nextButton} onClick={goToNextWord}>
            Weiter zum nächsten Wort
          </button>
        </div>
      ) : null}

      <audio ref={audioRef} preload="auto" aria-hidden="true" />
    </section>
  );
}

function toneClass(status: GameStatus, tone: FeedbackTone) {
  if (status === "success" || tone === "success") {
    return styles.feedbackSuccess;
  }
  if (status === "error" || tone === "error") {
    return styles.feedbackError;
  }
  return "";
}

