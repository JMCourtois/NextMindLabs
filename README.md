# NextMind Labs – Lernübungen

Interaktive Next.js-App mit App Router für kindgerechte Sprach- und Hörübungen. Das Projekt ist so strukturiert, dass mehrere Übungen nebeneinander bestehen können. Aktuell ist die Übung **„100 Fehlerwörter – Hör & Buchstabier“** umgesetzt.

## Schnellstart

```bash
npm install
npm run dev
```

Öffne anschließend `http://localhost:3000`.

- `npm run lint` – ESLint ausführen
- `npm run test` – Jest-Test-Suite für Hooks & Logik
- `npm run build && npm run export` – statischen Export erzeugen

> Hinweis: Für den ersten Start bitte `npm install` ausführen, damit `package-lock.json` mit den neuen Abhängigkeiten aktualisiert wird.

## Struktur (Auszug)

- `app/layout.tsx` – globales Layout inklusive Skip-Link
- `app/page.tsx` – Home-Hub mit Karten für alle Übungen
- `app/exercises/layout.tsx` – gemeinsames Layout/Fallback für alle Übungen
- `app/exercises/spelling-audio/…` – Umsetzung der „Fehlerwörter“-Übung (Client Components + Hook)
- `lib/types.ts` / `lib/utils.ts` – gemeinsam genutzte Typen & Helfer (z. B. `safeAudioPlay`)
- `public/data/words.json` – Datengrundlage für Wörter (statisch auslieferbar)
- `public/assets/audio/…` – Audio-Dateien pro Wort
- `__tests__/useSpellingGame.test.ts` – unit test für die Buchstaben-Logik
- `jest.config.ts`, `tsconfig.jest.json`, `jest.setup.ts` – Test-Setup

## Styling & Komponenten

- Globales Styling in `app/globals.css` mit Theme-Token
- Routspezifische Oberflächen via CSS Modules (z. B. `app/page.module.css`, `app/exercises/spelling-audio/styles.module.css`)
- UI-Bausteine & Hook sind im Exercise-Ordner gekapselt (`components/`, `hooks/`)
- Client Components werden nur dort eingesetzt, wo Interaktivität nötig ist (Audio, Eingabe, lokale Persistenz)

## Neue Übungen hinzufügen

1. Im Ordner `app/exercises/` einen neuen Unterordner anlegen, z. B. `reading-challenge`.
2. `page.tsx` als Client oder Server Component anlegen (je nach Bedarf).
3. Wiederverwendbare UI im lokalen Ordner `components/` und `styles.module.css` kapseln.
4. Die Übung über `app/page.tsx` in den Karten hinzufügen (`slug`, Beschreibung, ggf. Badge).
5. Optional: gemeinsame Typen/Helfer im Ordner `lib/` ergänzen.

## Neue Wörter zur Audio-Übung hinzufügen

1. `public/data/words.json` erweitern. Jedes Wort benötigt:
   - `id` – eindeutiger Schlüssel
   - `word` – Zielwort (Groß-/Kleinschreibung wie gewünscht)
   - `audioUrl` – Pfad innerhalb von `/public` (z. B. `/assets/audio/meinwort.mp3`)
   - `letters` – Array aller verfügbaren Buchstaben (inkl. Ablenkern)
   - optional `hints.tip` – kurzer Tipptext
2. Audio-Datei im Verzeichnis `public/assets/audio/` ablegen.
3. Bei Bedarf zusätzlich Buchstabenvarianten (ä, ß, Großbuchstaben) ergänzen.
4. Keine Anpassung am Hook nötig – das JSON wird clientseitig geladen.

## Tests & Qualität

- ESLint-Konfiguration: `.eslintrc.cjs` (Next + TypeScript + Prettier)
- Prettier-Konfiguration: `prettier.config.cjs`
- Jest & Testing Library für Hooks (`renderHook`) eingerichtet

## Barrierefreiheit & i18n

- Skip-Link im Root-Layout
- Semantische Überschriften & Gruppen (`aria-label`, `aria-live`, `role`)
- Tastaturbedienung: Audio, Buchstaben, Backspace, Enter, Escape
- Feedback wird per `aria-live` angesagt
- Texte aktuell in Deutsch, weitere Sprachen können über Wortliste bzw. neue Routen ergänzt werden

## Deployment-Hinweise

- Verzicht auf serverseitige APIs – das Projekt kann vollständig statisch exportiert werden (`next export`)
- Audio- und Wortdaten werden aus `/public` geladen, somit keine weitere Infrastruktur nötig

