# AGENTS.md — RogueReporter (originalet)

**Läs `CONTEXT.md` först.** Den beskriver spelets mätare, åtgärder, board,
datafiler och gotchas.

## Kontrakt

- Ändrar du struktur, mekanik, data eller deploy: **uppdatera `CONTEXT.md` i
  samma commit** som ändringen.
- **`docs/` är byggoutput (Vite outDir) — handredigera aldrig.** Ändra i `src/`
  och kör `npm run build` (committa builden).
- Balanssiffror: `src/balanceConfig.js` är enda källan för tunerbara värden.
- Håll rundräkningen synk: runda-logiken finns i både `CardScene` och
  `GameState._getCurrentRound()`.
- Rör inte död kod (`components/CardObject.js`, `engine/CardPhase.js`) annat än
  för att knyta till sig.
- Det här är **originalet** — RogueReporter2 ("The Scoop") är ett helt annat
  spel (deckbuilder). Kontrollera vilket repo frågan gäller.