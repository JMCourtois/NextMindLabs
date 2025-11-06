"use client";

import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
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

function shuffleArray<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  const [showNextPopup, setShowNextPopup] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const letterSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);

  const currentWord = words[currentIndex];

  const [shuffledLetters, setShuffledLetters] = useState<string[]>(() =>
    currentWord ? [...currentWord.letters] : []
  );

  const allowedLetters = useMemo(() => {
    return new Set((currentWord?.letters ?? []).map((letter) => letter.toLowerCase()));
  }, [currentWord]);

  const confettiPieces = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);

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
    setShowNextPopup(false);

    if (currentWord) {
      setShuffledLetters([...currentWord.letters]);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = currentWord.audioUrl;
      audioRef.current.load();
    }
  }, [currentWord]);

  useEffect(() => {
    if (!currentWord) {
      setShuffledLetters([]);
      return;
    }
    setShuffledLetters(shuffleArray(currentWord.letters));
  }, [currentWord]);

  useEffect(() => {
    if (typeof Audio === "undefined") {
      return;
    }
    letterSoundRef.current = new Audio("/assets/appsounds/letter-pop.mp3");
    errorSoundRef.current = new Audio("/assets/appsounds/error-buzz.mp3");
    successSoundRef.current = new Audio("/assets/appsounds/success-chime.mp3");

    [letterSoundRef.current, errorSoundRef.current, successSoundRef.current].forEach(
      (sound) => {
        if (sound) {
          sound.preload = "auto";
          sound.volume = 0.6;
        }
      }
    );

    return () => {
      letterSoundRef.current = null;
      errorSoundRef.current = null;
      successSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (showNextPopup && nextButtonRef.current) {
      nextButtonRef.current.focus();
    }
  }, [showNextPopup]);

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
    playSound(letterSoundRef);
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
      playSound(errorSoundRef);
      setFeedback({ message: "Fang mit einem Buchstaben an!", tone: "error" });
      setStatus("error");
      triggerShake();
      return;
    }

    if (attempt.length !== currentWord.word.length) {
      const remaining = currentWord.word.length - attempt.length;
      const message =
        remaining > 0
          ? `Dir fehlen noch ${remaining} Buchstabe${remaining === 1 ? "" : "n"}.`
          : "Du hast zu viele Buchstaben gewählt.";
      playSound(errorSoundRef);
      setFeedback({ message, tone: "error" });
      setStatus("error");
      triggerShake();
      return;
    }

    if (attempt === currentWord.word) {
      setIsLocked(true);
      setStatus("success");
      setFeedback({ message: "Richtig!", tone: "success" });
      playSound(successSoundRef);
      setShowNextPopup(true);
    } else {
      const hint = currentWord.hints?.tip ? `Tipp: ${currentWord.hints.tip}` : "Versuch es noch einmal.";
      playSound(errorSoundRef);
      setFeedback({ message: `Noch nicht ganz richtig. ${hint}`, tone: "error" });
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
    setShowNextPopup(false);
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

  function playSound(ref: MutableRefObject<HTMLAudioElement | null>) {
    const sound = ref.current;
    if (!sound) {
      return;
    }
    try {
      sound.currentTime = 0;
      void sound.play();
    } catch (error) {
      console.warn("Konnte Sound nicht abspielen", error);
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
          <svg
            className="audio-icon"
            aria-hidden="true"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20.3 9.4 11 16H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5l9.3 6.6a2 2 0 0 0 3.2-1.6V11a2 2 0 0 0-3.2-1.6ZM18 16.8v14.4L12.8 28H8v-8h4.8ZM31.7 12.3a2 2 0 1 0-3.4 2c2 3.3 2 8.4 0 11.7a2 2 0 1 0 3.4 2c3-5 3-10.7 0-15.7Zm6.6-5.5a2 2 0 0 0-3.4 2c4.3 7.2 4.3 18 0 25.2a2 2 0 0 0 3.4 2c5-8.4 5-20.8 0-29.2Z" />
          </svg>
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
        <p className="hint-text" aria-live="polite">
          {currentWord.hints?.tip ?? ""}
        </p>
      </section>

      <div
        className={`letter-grid${isLocked ? " is-locked" : ""}`}
        role="group"
        aria-label="Buchstaben auswählen"
      >
        {shuffledLetters.map((letter: string, index: number) => (
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
          className="control-button control-button--icon"
          onClick={handleBackspace}
          disabled={isLocked || userInput.length === 0}
          aria-label="Letzten Buchstaben löschen"
          title="Backspace"
        >
          <span aria-hidden="true" className="control-icon">⌫</span>
        </button>
        <button
          type="button"
          className="control-button control-button--primary control-button--check"
          onClick={handleCheck}
          disabled={isLocked}
        >
          Check
        </button>
        <button
          type="button"
          className="control-button control-button--icon"
          onClick={handleClear}
          disabled={isLocked || userInput.length === 0}
          aria-label="Eingabe löschen"
          title="Alles löschen"
        >
          <span aria-hidden="true" className="control-icon">🧽</span>
        </button>
      </div>

      <div
        className={`feedback${feedback.tone === "success" ? " feedback--success" : feedback.tone === "error" ? " feedback--error" : ""}`}
        aria-live="polite"
      >
        {feedback.message}
      </div>

      {showNextPopup && (
        <div
          className="next-popup next-popup--visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nextDialogTitle"
        >
          <div className="next-popup__content">
            <div className="next-popup__confetti" aria-hidden="true">
              {confettiPieces.map((piece) => (
                <span
                  key={piece}
                  className={`confetti__piece confetti__piece--${(piece % 6) + 1}`}
                ></span>
              ))}
            </div>
            <p id="nextDialogTitle" className="next-popup__title">
              Super gemacht!
            </p>
            <button
              ref={nextButtonRef}
              type="button"
              className="next-popup__button"
              onClick={handleNext}
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

