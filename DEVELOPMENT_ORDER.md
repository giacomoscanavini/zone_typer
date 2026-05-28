# Zone Typers refactor: development order

This refactor keeps the original no-build browser setup. The code is still loaded by `index.html` with ordinary `<script>` tags, but each script now has one clearer responsibility.
## Why this order

The development order follows dependency order:

1. Create global browser handles and constants.
2. Add static game content.
3. Load assets and audio primitives.
4. Define stage rules and game lifecycle.
5. Add powerup behavior.
6. Add combat behavior.
7. Add input handling.
8. Add simulation updates.
9. Add rendering.
10. Start the game.

Because this project does not use JavaScript modules yet, `index.html` is the dependency graph. Scripts that define shared constants and functions must appear before scripts that use them.
## Phase 0 — Foundation

Goal: create the minimum shared environment that every later phase needs.

Scripts:

- `js/00-foundation/dom.js` — canvas, drawing context, canvas dimensions.
- `js/00-foundation/powerupConfig.js` — powerup definitions, keywords, and keyword detection.
- `js/00-foundation/gameConfig.js` — version, combo configuration, mutable `GAME` state.
- `js/00-foundation/utils.js` — generic helpers: `clamp`, `randomChoice`.

Build this first because nearly every later file depends on `GAME`, `WIDTH`, `HEIGHT`, `POWERUPS`, or utility helpers.
## Phase 1 — Static game content

Goal: define data before writing behavior that consumes it.

Scripts:

- `js/01-content/wordTiers.js` — all word pools by difficulty tier.
- `js/01-content/monsterTypes.js` — monster stats and display metadata.

This phase is data-only, so it is safe to change content without touching game rules.
## Phase 2 — Assets and audio base

Goal: prepare external resources and low-level sound helpers.

Scripts:

- `js/02-assets/sprites.js` — sprite image loading map.
- `js/03-audio/audioState.js` — audio context and music timer state.
- `js/03-audio/audioEngine.js` — low-level tone, sweep, and chord helpers.
- `js/03-audio/soundEffects.js` — named gameplay sounds.
- `js/03-audio/music.js` — background music loop logic.

Write the audio engine before sound effects. Sound effects should stay as small wrappers around primitive audio functions.
## Phase 3 — Stage model

Goal: create the rules that define difficulty, lane layout, word selection, monster spawning, and reset behavior.

Scripts:

- `js/04-stage/stageScaling.js` — stage-to-difficulty formulas and combo progress helpers.
- `js/04-stage/telemetry.js` — telemetry, accuracy, and lane danger.
- `js/04-stage/wordSelection.js` — word pool selection and duplicate avoidance.
- `js/04-stage/monsterSelection.js` — monster type probability rules.
- `js/04-stage/lanes.js` — lane geometry and rebuild logic.
- `js/04-stage/monsters.js` — monster object creation.
- `js/04-stage/stageLifecycle.js` — stage start, restart, completed lane lookup, word replacement.

This is the first phase where the game can construct a playable board, even before combat and rendering are finished.
## Phase 4 — Powerups

Goal: define how held powers are offered, stored, activated, and applied.

Scripts:

- `js/05-powerups/powerState.js` — active-power lookup.
- `js/05-powerups/wordEffects.js` — lowercase and alphabetic-only transformations.
- `js/05-powerups/inventory.js` — choice offering, selection, and removal.
- `js/05-powerups/activation.js` — instant and timed power activation.

Powerups come before combat because combat checks active powers such as `drill`, `laser`, `freeze`, and `wind`.
## Phase 5 — Combat

Goal: implement scoring, projectiles, laser impacts, monster deaths, and power lasers.

Scripts:

- `js/06-combat/combo.js` — combo XP, reset/downgrade, scoring formula.
- `js/06-combat/projectiles.js` — laser creation and impact resolution.
- `js/06-combat/monsterKills.js` — kill reward and screen-clear behavior.
- `js/06-combat/playerFire.js` — normal lane laser firing.
- `js/06-combat/powerLasers.js` — extra laser targeting from powerups.

`monsterKills.js` loads before `playerFire.js` and `powerLasers.js` because those files call kill behavior.
## Phase 6 — Input

Goal: connect keyboard events to game actions.

Scripts:

- `js/07-input/typing.js` — character validation, input accumulation, wrong-input penalties, completed-word detection.
- `js/07-input/keyboard.js` — browser `keydown` listener.

Keep DOM events isolated in `keyboard.js`; that makes typing behavior easier to test later.
## Phase 7 — Simulation update

Goal: update game state each animation frame.

Scripts:

- `js/08-update/timers.js` — countdown timers for messages, powers, flashes, and screen shake.
- `js/08-update/simulation.js` — monster movement, breach detection, stage completion, laser movement, floating text movement.

The update phase should mutate state only. Rendering stays separate.
## Phase 8 — Rendering

Goal: draw the current game state without changing gameplay rules.

Scripts:

- `js/09-render/primitives.js` — reusable drawing helpers.
- `js/09-render/background.js` — city background.
- `js/09-render/board.js` — lanes, grid, words, input panel.
- `js/09-render/monsters.js` — sprites, health, shields, labels.
- `js/09-render/lasers.js` — laser effects.
- `js/09-render/hud.js` — score, combo, inventory, active timers, floating text.
- `js/09-render/powerupChoices.js` — powerup selection cards.
- `js/09-render/overlays.js` — start, stage, clear, and game-over overlays.
- `js/09-render/renderLoop.js` — `render` and animation-frame `loop`.

Rendering is last because it depends on almost every earlier phase but should not define gameplay rules.
## Phase 9 — Bootstrap

Goal: initialize the game and start the animation loop.

Scripts:

- `js/main.js` — calls `restartGame`, initializes `GAME.lastTime`, and starts `requestAnimationFrame`.

This file should stay tiny. If it grows, move behavior into an earlier phase.
## Current script load order

`index.html` loads scripts in this exact order:

```html
<script src="js/00-foundation/dom.js"></script>
<script src="js/00-foundation/powerupConfig.js"></script>
<script src="js/00-foundation/gameConfig.js"></script>
<script src="js/00-foundation/utils.js"></script>
<script src="js/01-content/wordTiers.js"></script>
<script src="js/01-content/monsterTypes.js"></script>
<script src="js/02-assets/sprites.js"></script>
<script src="js/03-audio/audioState.js"></script>
<script src="js/03-audio/audioEngine.js"></script>
<script src="js/03-audio/soundEffects.js"></script>
<script src="js/03-audio/music.js"></script>
<script src="js/04-stage/stageScaling.js"></script>
<script src="js/04-stage/telemetry.js"></script>
<script src="js/04-stage/wordSelection.js"></script>
<script src="js/04-stage/monsterSelection.js"></script>
<script src="js/04-stage/lanes.js"></script>
<script src="js/04-stage/monsters.js"></script>
<script src="js/04-stage/stageLifecycle.js"></script>
<script src="js/05-powerups/powerState.js"></script>
<script src="js/05-powerups/wordEffects.js"></script>
<script src="js/05-powerups/inventory.js"></script>
<script src="js/05-powerups/activation.js"></script>
<script src="js/06-combat/combo.js"></script>
<script src="js/06-combat/projectiles.js"></script>
<script src="js/06-combat/monsterKills.js"></script>
<script src="js/06-combat/playerFire.js"></script>
<script src="js/06-combat/powerLasers.js"></script>
<script src="js/07-input/typing.js"></script>
<script src="js/07-input/keyboard.js"></script>
<script src="js/08-update/timers.js"></script>
<script src="js/08-update/simulation.js"></script>
<script src="js/09-render/primitives.js"></script>
<script src="js/09-render/background.js"></script>
<script src="js/09-render/board.js"></script>
<script src="js/09-render/monsters.js"></script>
<script src="js/09-render/lasers.js"></script>
<script src="js/09-render/hud.js"></script>
<script src="js/09-render/powerupChoices.js"></script>
<script src="js/09-render/overlays.js"></script>
<script src="js/09-render/renderLoop.js"></script>
<script src="js/main.js"></script>
```

## Suggested next refactor

After this split is stable, convert the scripts to ES modules. That would replace hidden browser-global dependencies with explicit `import` and `export` statements. Do that only after the current no-build version still runs correctly.
