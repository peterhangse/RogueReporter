# CONTEXT.md — RogueReporter (originalet; RogueReporter2 = helt annat spel)

**"Rogue Reporter"** — konspirationsjournalistik-roguelike i webbläsaren
(Phaser 3 + Vite + **JavaScript**, inget TypeScript). Demo v0.1: "THE DAILY
EXPOSÉ". Källkritik, deadlines och trovärdighet som gameplay. Live:
https://roguereporter-game.web.app

## Teknik (verifierat)

- Phaser 3.80 + Vite 7 (JS). Enda npm-beroenden: `phaser`, `vite`.
- **`docs/` = bygg-output (Vite outDir), aldrig handredigera** — ändra i `src/`,
  kör `npm run build`. Firebase publicerar från `docs/` (SPA-rewrite → index.html).
- Zero assets: all grafik är Phaser-Graphics-primitiver + text; musik/SFX
  proceduran (Web Audio i `src/audio/MusicManager.js`). Google Fonts.
- UI-språk: **engelska**.

## Struktur

| Sökväg | Roll |
|---|---|
| `src/main.js` | Phaser-config 960×600 + scenregistrering + global felgräns (→ Menu vid krasch) |
| `src/GameState.js` | Runs state (3 mätare, board-noder, save/load `rr_gamestate` v2) |
| `src/constants.js` | Färger, mått, fontstilar |
| `src/balanceConfig.js` | **Alla tunerbara siffror på ett ställe** (kostnader, trösklar, poängvikter) |
| `src/scenes/` | 12 scener (Boot→Menu→ConspiracySelect→Briefing→EditorIntro→Card⇄Board→Publish/Deadline→Results→GameOver + UIOverlay) |
| `src/components/` | MeterBar, LeadCard, MiniBoard, HeatOverlay, NodeObject, ConnectionLine |
| `src/engine/` | DeckManager (deck + beat-kort) |
| `src/utils/` | scoreCalculator, boardValidator, drawDashedLine, shuffle |
| `public/data/` | Allt speldata (kopieras till `docs/data/` vid build) |

## Mekanik

- **Tre mätare:** Credibility (0 à 100 = FIRED), Heat (100 = ARRESTED),
  Deadline (100 = forced publish).
- **4 åtgärder/lead** (kostar deadlineolika: höger 8, vänster 5, upp 4, ner 6):
  `→ INVESTIGATE` (äkta bevis, öppnar solid nod), `← IGNORE` (säkert),
  `↑ FAKE` (fabricerar nod — streckad, −credibility), `↓ LEAK` (kyler heat, kostar cred).
- **Konspirationsboard:** koppla noder i par; stark svag/fabricerad/återvändsgränd
  (`dead_end` med X och −5p). Vinst = 5 noder + 3 starka länkar → PUBLISH.
- **Källkort som mekanik:** varje kort är en källa (`credibility` 2–10,
  `type` witness/document/photo/event); otillförlitliga källor straffas.
- **Deadline som timer:** varje drag tickar deadline; vid 100 trycker chefen på print.
- **Tabloid-läge** (<20 cred): dubbel heat, fabricering kostar ingen cred.
- Beat-kort (`beatCards.triggerAfter`) injicerar skriptade händelser; polis-razzia
  vid heat>80; tension +3 heat/runda efter runda 8.
- Poäng: `cred×10 + noder×50 + stark×25 + svag×10 − fabricerad×15 − deadEnd×5`;
  grader PULITZER ≥1000 / SCOOP ≥650 / BYLINE ≥350 / FILLER ≥100 / FIRED <100.

## Data (public/data/*.json)

- `cards-tutorial.json` (4 tvingade tutorial-kort), `cards-trench-coat.json`
  (20 story-kort med `swipeEffects`), `board-trench-coat.json` (graf + noder;
  MAYOR låst tills 4 noder sammankopplade), `conspiracy-trench-coat.json`
  (5 beat-kort).
- Endast fallet `trench_coat_kids` är spelbart.

## Regler och gotchas

- Behåll `docs/` synk: bygg efter src-ändring, committa builden.
- **Död kod** som inte importeras: `components/CardObject.js`,
  `components/NewspaperDecor.js`, `engine/CardPhase.js` (övergiven swipe-prototyp).
- Rundräkning finns dubblerad (CardScene vs `GameState._getCurrentRound()`) —
  håll i synk vid balansering.
- Inga tester/lint/CI; kvalitetsgrind = manuell dev-körning + `.fabrik`-deploy.
- Datadatakurs i `docs/data/` måste matcha `public/data/` (verifierad byte-identisk idag).

## Köra / deploya

- `npm install && npm run dev` (Vite, lokal server).
- `npm run build` → docs/; `npm run deploy` = build + `firebase deploy`.
- .fabrik-rad: `(test -d node_modules || npm install) && npm run build && git push origin main && firebase deploy`.

## Notis

- **RogueReporter2 ("The Scoop") är ett helt annat spel** — en StS-lik deckbuilder,
  inte detta pussel. Kolla vilket repo frågan gäller; varianterna blandas lätt ihop.