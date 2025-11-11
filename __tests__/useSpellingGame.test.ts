import { act, renderHook } from "@testing-library/react";
import type { SpellingWord } from "@/lib/types";
import { useSpellingGame } from "@/app/exercises/spelling-audio/hooks/useSpellingGame";

const TEST_WORDS: SpellingWord[] = [
  {
    id: "haus",
    word: "Haus",
    audioUrl: "/assets/audio/wieder.mp3",
    letters: ["H", "a", "u", "s", "o"],
    hints: { tip: "Großes H am Anfang." },
  },
];

describe("useSpellingGame", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("marks a correct answer as success", () => {
    const { result } = renderHook(() =>
      useSpellingGame({
        initialWords: TEST_WORDS,
        shouldShuffle: false,
        storageKey: "test-spelling-success",
      }),
    );

    expect(result.current.currentWord?.word).toBe("Haus");

    act(() => {
      result.current.selectLetter("H");
      result.current.selectLetter("a");
      result.current.selectLetter("u");
      result.current.selectLetter("s");
      result.current.checkAnswer();
    });

    expect(result.current.status).toBe("success");
    expect(result.current.showNextPrompt).toBe(true);
    expect(result.current.feedback.tone).toBe("success");
  });

  it("provides feedback when the assembled word is incorrect", () => {
    const { result } = renderHook(() =>
      useSpellingGame({
        initialWords: TEST_WORDS,
        shouldShuffle: false,
        storageKey: "test-spelling-error",
      }),
    );

    act(() => {
      result.current.clearInput();
      result.current.selectLetter("H");
      result.current.selectLetter("o");
      result.current.checkAnswer();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.feedback.tone).toBe("error");
    expect(result.current.showNextPrompt).toBe(false);
  });
});

