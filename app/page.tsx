"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import wordsJson from "@/data/words.json";

type Word = {
  id: string;
  word: string;
  audioUrl: string;
  letters: string[];
  hints?: {
    tip?: string;
  };
};

type FeedbackTone = "neutral" | "success" | "error";

const STORAGE_KEY = "de_vocab_progress_v2";

function normalizeIndex(index: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return ((index % total) + total) % total;
}

export default function HomePage() {
  const [words] = useState<Word[]>(() => wordsJson as Word[]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<{ message: string; tone: FeedbackTone }>({
    message: "",
    tone: "neutral",
  });
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isAudioBusy, setIsAudioBusy] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [shake, setShake] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentWord = words[currentIndex];

  const allowedLetters = useMemo(() => {
    return new Set((currentWord?.letters ?? []).map((letter) => letter.toLowerCase()));
  }, [currentWord]);

  useEffect(() => {
    if (typeof window === "undefined" || words.length === 0) {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          index?: number;
          mistakes?: Record<string, number>;
        };
        const index = normalizeIndex(parsed.index ?? 0, words.length);
        setCurrentIndex(index);
        setMistakes(parsed.mistakes ?? {});
      }
    } catch (error) {
      console.warn("Konnte Fortschritt nicht laden", error);
    } finally {
      setProgressLoaded(true);
    }
  }, [words.length]);

  useEffect(() => {
    if (!progressLoaded || typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ index: currentIndex, mistakes })
      );
    } catch (error) {
      console.warn("Konnte Fortschritt nicht speichern", error);
    }
  }, [currentIndex, mistakes, progressLoaded]);

  useEffect(() => {
    if (!currentWord) {
      return;
    }
    setUserInput([]);
    setIsLocked(false);
    setStatus("idle");
    setFeedback({ message: "", tone: "neutral" });
    setShake(false);
    setAudioAvailable(true);
    setIsAudioBusy(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = currentWord.audioUrl;
      audioRef.current.load();
    }
  }, [currentWord]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!currentWord) {
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleCheck();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        handleClear();
        return;
      }
      const key = event.key.toLowerCase();
      if (key.length === 1 && allowedLetters.has(key)) {
        event.preventDefault();
        handleLetterClick(key);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [allowedLetters, currentWord]);

  if (!currentWord) {
    return (
      <main className="app-shell">
        <p>Keine Wörter verfügbar. Bitte Wörterliste prüfen.</p>
      </main>
    );
  }

  function handleLetterClick(letter: string) {
    if (isLocked) {
      return;
    }
    if (userInput.length >= currentWord.word.length) {
      triggerShake();
      return;
    }
    setUserInput((prev: string[]) => [...prev, letter]);
  }

  function handleBackspace() {
    if (isLocked || userInput.length === 0) {
      return;
    }
    setUserInput((prev: string[]) => prev.slice(0, prev.length - 1));
  }

  function handleClear() {
    if (isLocked || userInput.length === 0) {
      return;
    }
    setUserInput([]);
    setFeedback({ message: "", tone: "neutral" });
    setStatus("idle");
  }

  function handleCheck() {
    if (isLocked) {
      return;
    }
    const attempt = userInput.join("");

    if (!attempt.length) {
      setFeedback({ message: "Starte mit einem Buchstaben!", tone: "error" });
      setStatus("error");
      triggerShake();
      return;
    }

    if (attempt.length !== currentWord.word.length) {
      const remaining = currentWord.word.length - attempt.length;
      const message =
        remaining > 0
          ? `Dir fehlen noch ${remaining} Buchstabe${remaining === 1 ? "" : "n"}.`
          : "Zu viele Buchstaben.";
      setFeedback({ message, tone: "error" });
      setStatus("error");
      triggerShake();
      return;
    }

    if (attempt === currentWord.word) {
      setIsLocked(true);
      setStatus("success");
      setFeedback({ message: "Richtig!", tone: "success" });
    } else {
      const hint = currentWord.hints?.tip ? `Tipp: ${currentWord.hints.tip}` : "Versuch es noch einmal.";
      setFeedback({ message: `Fast! ${hint}`, tone: "error" });
      setStatus("error");
      triggerShake();
      setMistakes((prev: Record<string, number>) => ({
        ...prev,
        [currentWord.id]: (prev[currentWord.id] ?? 0) + 1,
      }));
    }
  }

  function handleNext() {
    if (words.length === 0) {
      return;
    }
    setCurrentIndex((prev: number) => normalizeIndex(prev + 1, words.length));
  }

  function triggerShake() {
    setShake(true);
  }

  function handleAnimationEnd() {
    if (shake) {
      setShake(false);
    }
  }

  async function handleAudioClick() {
    if (!audioRef.current || !audioAvailable) {
      return;
    }
    try {
      setIsAudioBusy(true);
      await audioRef.current.play();
    } catch (error) {
      console.warn("Audio playback failed", error);
      setIsAudioBusy(false);
      setAudioAvailable(false);
      setFeedback({ message: "Audio fehlt – bitte Lehrer:in informieren.", tone: "error" });
    }
  }

  const wordDisplayClasses = ["word-display__input"];
  if (status === "success") {
    wordDisplayClasses.push("word-display__input--correct");
  }
  if (status === "error") {
    wordDisplayClasses.push("word-display__input--error");
  }
  if (shake) {
    wordDisplayClasses.push("word-display__input--shake");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="audio-button"
          onClick={handleAudioClick}
          disabled={isAudioBusy || !audioAvailable}
          aria-label={audioAvailable ? "Wort anhören" : "Audio nicht verfügbar"}
          title={audioAvailable ? "Wort anhören" : "Audio fehlt"}
        >
          <span aria-hidden="true">🔊</span>
        </button>
        <p className="progress-text" aria-live="polite">
          Wort {currentIndex + 1} von {words.length}
        </p>
        <audio
          ref={audioRef}
          preload="auto"
          onEnded={() => setIsAudioBusy(false)}
          onPause={() => setIsAudioBusy(false)}
          onError={() => {
            setIsAudioBusy(false);
            setAudioAvailable(false);
            setFeedback({ message: "Audio fehlt – bitte Lehrer:in informieren.", tone: "error" });
          }}
        />
      </header>

      <section className="word-panel" aria-labelledby="wordPrompt">
        <p id="wordPrompt" className="word-prompt">
          Baue das Wort:
        </p>
        <div className="word-display">
          <div
            role="textbox"
            aria-readonly="true"
            aria-live="polite"
            className={wordDisplayClasses.join(" ")}
            onAnimationEnd={handleAnimationEnd}
          >
            {userInput.join("")}
          </div>
          <div className="letter-count" aria-hidden="true">
            {userInput.length} / {currentWord.word.length}
          </div>
        </div>
        <button
          type="button"
          className="check-button"
          onClick={handleCheck}
          disabled={isLocked}
        >
          Check
        </button>
        <p className="hint-text" aria-live="polite">
          {currentWord.hints?.tip ?? ""}
        </p>
      </section>

      <div
        className={`letter-grid${isLocked ? " is-locked" : ""}`}
        role="group"
        aria-label="Buchstaben auswählen"
      >
        {currentWord.letters.map((letter: string, index: number) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            className="letter-button"
            onClick={() => handleLetterClick(letter)}
            disabled={isLocked}
            aria-label={`Buchstabe ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="control-row" role="group" aria-label="Aktionen">
        <button
          type="button"
          className="control-button"
          onClick={handleBackspace}
          disabled={isLocked || userInput.length === 0}
        >
          Backspace
        </button>
        <button
          type="button"
          className="control-button"
          onClick={handleClear}
          disabled={isLocked || userInput.length === 0}
        >
          Clear
        </button>
        <button
          type="button"
          className="control-button"
          onClick={handleNext}
          disabled={!isLocked}
        >
          Next
        </button>
      </div>

      <div
        className={`feedback${feedback.tone === "success" ? " feedback--success" : feedback.tone === "error" ? " feedback--error" : ""}`}
        aria-live="polite"
      >
        {feedback.message}
      </div>
    </main>
  );
}

