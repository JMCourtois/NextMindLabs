"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpellingFeedback, SpellingWord } from "@/lib/types";
import {
  normalizeIndex,
  readLocalStorage,
  shuffleArray,
  writeLocalStorage,
} from "@/lib/utils";

export type GameStatus = "idle" | "success" | "error";

type StoredProgress = {
  index?: number;
  mistakes?: Record<string, number>;
};

type UseSpellingGameOptions = {
  initialWords?: SpellingWord[];
  storageKey?: string;
  shouldShuffle?: boolean;
};

type UseSpellingGameResult = {
  loading: boolean;
  loadError: string | null;
  totalWords: number;
  currentIndex: number;
  currentWord: SpellingWord | undefined;
  letterPool: string[];
  userInput: string[];
  status: GameStatus;
  feedback: SpellingFeedback;
  isLocked: boolean;
  showNextPrompt: boolean;
  audioAvailable: boolean;
  shouldShake: boolean;
  mistakes: Record<string, number>;
  selectLetter: (letter: string) => void;
  removeLetter: () => void;
  clearInput: () => void;
  checkAnswer: () => void;
  goToNextWord: () => void;
  refreshLetters: () => void;
  acknowledgeShake: () => void;
  markAudioUnavailable: () => void;
  resetAudioAvailability: () => void;
  isValidLetter: (value: string) => boolean;
};

const DEFAULT_STORAGE_KEY = "nextmindlabs_spelling_progress_v1";

export function useSpellingGame(
  options: UseSpellingGameOptions = {},
): UseSpellingGameResult {
  const {
    initialWords,
    storageKey = DEFAULT_STORAGE_KEY,
    shouldShuffle = true,
  } = options;

  const [words, setWords] = useState<SpellingWord[]>(initialWords ?? []);
  const [loading, setLoading] = useState<boolean>(() => !(initialWords && initialWords.length));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [feedback, setFeedback] = useState<SpellingFeedback>({
    message: "",
    tone: "neutral",
  });
  const [isLocked, setIsLocked] = useState(false);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [shouldShake, setShouldShake] = useState(false);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  const totalWords = words.length;
  const currentWord = useMemo(
    () => (totalWords > 0 ? words[normalizeIndex(currentIndex, totalWords)] : undefined),
    [currentIndex, totalWords, words],
  );

  const allowedLetters = useMemo(() => {
    const letters = currentWord?.letters ?? [];
    return new Set(letters.map((letter) => letter.toLowerCase()));
  }, [currentWord]);

  useEffect(() => {
    if (initialWords && initialWords.length) {
      return;
    }

    let isMounted = true;

    async function loadWords() {
      try {
        setLoading(true);
        const response = await fetch("/data/words.json", { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load words.json: ${response.statusText}`);
        }
        const payload = (await response.json()) as SpellingWord[];
        if (isMounted) {
          setWords(payload);
          setLoadError(null);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setLoadError("Konnte die Wörter nicht laden. Bitte Seite neu laden oder später erneut versuchen.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadWords();

    return () => {
      isMounted = false;
    };
  }, [initialWords]);

  useEffect(() => {
    if (!totalWords || progressLoaded) {
      return;
    }

    const stored = readLocalStorage<StoredProgress | null>(storageKey, null);
    if (stored) {
      setCurrentIndex(normalizeIndex(stored.index ?? 0, totalWords));
      setMistakes(stored.mistakes ?? {});
    }
    setProgressLoaded(true);
  }, [progressLoaded, storageKey, totalWords]);

  useEffect(() => {
    if (!progressLoaded) {
      return;
    }

    writeLocalStorage<StoredProgress>(storageKey, {
      index: currentIndex,
      mistakes,
    });
  }, [currentIndex, mistakes, progressLoaded, storageKey]);

  useEffect(() => {
    if (!currentWord) {
      setLetterPool([]);
      setUserInput([]);
      setStatus("idle");
      setFeedback({ message: "", tone: "neutral" });
      setIsLocked(false);
      setShowNextPrompt(false);
      setAudioAvailable(true);
      setShouldShake(false);
      return;
    }

    const nextLetters = shouldShuffle
      ? shuffleArray(currentWord.letters)
      : [...currentWord.letters];
    setLetterPool(nextLetters);
    setUserInput([]);
    setStatus("idle");
    setFeedback({ message: "", tone: "neutral" });
    setIsLocked(false);
    setShowNextPrompt(false);
    setAudioAvailable(true);
    setShouldShake(false);
  }, [currentWord, shouldShuffle]);

  const selectLetter = useCallback(
    (letter: string) => {
      if (!currentWord || isLocked) {
        return;
      }

      if (userInput.length >= currentWord.word.length) {
        setStatus("error");
        setFeedback({
          message: "Du hast bereits alle Buchstaben gewählt.",
          tone: "error",
        });
        setShouldShake(true);
        return;
      }

      setUserInput((previous) => [...previous, letter]);
      if (status === "error" && feedback.tone === "error") {
        setFeedback({ message: "", tone: "neutral" });
      }
      setStatus("idle");
    },
    [currentWord, feedback.tone, isLocked, status, userInput.length],
  );

  const removeLetter = useCallback(() => {
    if (isLocked || userInput.length === 0) {
      return;
    }

    setUserInput((previous) => previous.slice(0, previous.length - 1));
    if (status !== "success") {
      setStatus("idle");
    }
  }, [isLocked, status, userInput.length]);

  const clearInput = useCallback(() => {
    if (isLocked || userInput.length === 0) {
      return;
    }
    setUserInput([]);
    setStatus("idle");
    setFeedback({ message: "", tone: "neutral" });
  }, [isLocked, userInput.length]);

  const checkAnswer = useCallback(() => {
    if (!currentWord || isLocked) {
      return;
    }

    const attempt = userInput.join("");
    if (!attempt) {
      setStatus("error");
      setFeedback({
        message: "Bitte beginne mit dem ersten Buchstaben.",
        tone: "error",
      });
      setShouldShake(true);
      return;
    }

    if (attempt.length !== currentWord.word.length) {
      const remaining = currentWord.word.length - attempt.length;
      const message =
        remaining > 0
          ? `Dir fehlen noch ${remaining} Buchstabe${remaining === 1 ? "" : "n"}.`
          : "Du hast zu viele Buchstaben gewählt.";
      setStatus("error");
      setFeedback({ message, tone: "error" });
      setShouldShake(true);
      return;
    }

    if (attempt === currentWord.word) {
      setStatus("success");
      setFeedback({ message: "Sehr gut! Weiter so.", tone: "success" });
      setIsLocked(true);
      setShowNextPrompt(true);
      return;
    }

    setStatus("error");
    const hint = currentWord.hints?.tip;
    setFeedback({
      message: hint ? `Schon nah dran! Hinweis: ${hint}` : "Versuch es noch einmal.",
      tone: "error",
    });
    setShouldShake(true);
    setMistakes((previous) => ({
      ...previous,
      [currentWord.id]: (previous[currentWord.id] ?? 0) + 1,
    }));
  }, [currentWord, isLocked, userInput]);

  const goToNextWord = useCallback(() => {
    if (!totalWords) {
      return;
    }
    setShowNextPrompt(false);
    setCurrentIndex((previous) => normalizeIndex(previous + 1, totalWords));
  }, [totalWords]);

  const refreshLetters = useCallback(() => {
    if (!currentWord) {
      return;
    }
    setLetterPool(
      shouldShuffle ? shuffleArray(currentWord.letters) : [...currentWord.letters],
    );
  }, [currentWord, shouldShuffle]);

  const acknowledgeShake = useCallback(() => {
    setShouldShake(false);
  }, []);

  const markAudioUnavailable = useCallback(() => {
    setAudioAvailable(false);
    setFeedback({
      message: "Audio nicht verfügbar – bitte Lehrkraft informieren.",
      tone: "error",
    });
  }, []);

  const resetAudioAvailability = useCallback(() => {
    setAudioAvailable(true);
  }, []);

  const isValidLetter = useCallback(
    (value: string) => {
      if (!value || value.length !== 1) {
        return false;
      }
      return allowedLetters.has(value.toLowerCase());
    },
    [allowedLetters],
  );

  return {
    loading,
    loadError,
    totalWords,
    currentIndex,
    currentWord,
    letterPool,
    userInput,
    status,
    feedback,
    isLocked,
    showNextPrompt,
    audioAvailable,
    shouldShake,
    mistakes,
    selectLetter,
    removeLetter,
    clearInput,
    checkAnswer,
    goToNextWord,
    refreshLetters,
    acknowledgeShake,
    markAudioUnavailable,
    resetAudioAvailability,
    isValidLetter,
  };
}

