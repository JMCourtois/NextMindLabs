export function normalizeIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return ((index % total) + total) % total;
}

export function shuffleArray<T>(items: T[], randomFn: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function safeAudioPlay(element: HTMLAudioElement | null): Promise<boolean> {
  if (!element) {
    return false;
  }

  try {
    element.currentTime = 0;
    await element.play();
    return true;
  } catch (error) {
    console.warn("Audio playback failed", error);
    return false;
  }
}

export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Could not parse localStorage value for ${key}`, error);
    return fallback;
  }
}

export function writeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not persist localStorage value for ${key}`, error);
  }
}

