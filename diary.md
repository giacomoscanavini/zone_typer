# Diary

Tracks what changed, what needs testing, and whether it passed.

---

## V1.0 — Core Prototype

### Built
- Browser-playable game prototype
- Lane/grid system
- Monsters spawn and move toward the zone
- Game over when monsters reach the zone
- One word per lane
- Typing a word fires a laser in that lane
- Monsters take damage and die
- Basic stage progression
- More lanes added as stages progress
- Minimal HUD and feedback

### Modified
- Initial implementation only

### Needs Testing
- Typing responsiveness
- Lane readability
- Monster speed balance
- Stage difficulty curve
- Game over reliability
- Laser targeting reliability

### Validation Status
- Game runs
- Core loop validated as working

### Next
- V1.1: tuning, readability, and basic telemetry

---

## V1.2 — Readability and Word Difficulty

### Built
- Removed lane count from top HUD
- Removed lane labels beside words
- Moved lane words to the right of the protected zone
- Added stage-based word difficulty pools

### Modified
- Battlefield width adjusted to make room for always-visible words
- HUD now shows only Stage, Score, Accuracy, and Kills

### Needs Testing
- Word visibility when monsters crowd lanes
- Whether harder words appear at later stages
- HUD readability
- Laser targeting after layout shift
- Difficulty curve after word pool changes

### Validation Status
- Pending

### Next
- Validate V1.2 gameplay, then decide whether to tune difficulty or add power-ups
---

## V1.3 — Layout Cleanup

### Built
- Reduced lane row height by about half
- Removed top-right word telemetry panel
- Removed danger bars

### Needs Testing
- Lane readability after tighter row height
- Monster/word alignment
- Visual clarity with higher lane counts

### Validation Status
- Pending



---

## V1.4 — Centered Board Layout

### Built
- Board now stays vertically centered.
- Board position recalculates when new lanes appear at stage start.
- Stage overlay no longer repeats lane count.

### Needs Testing
- Board centering with 3–8 lanes.
- Lane expansion at new stage start.
- Word alignment after board shifts.
- Monster lane alignment after board shifts.

### Validation Status
- Pending.
---

## V1.5 — Centered Input Display

### Built
- Moved the input display below the playing board.
- Centered the input display horizontally.
- Increased input text size.
- Removed input text from the upper HUD area.

### Needs Testing
- Input visibility with 3–8 lanes.
- Input position after new lanes appear.
- HUD readability after removing top input line.

### Validation Status
- Pending.

---

## V2.0 — Monster Types, Combo, and Audio

### Built
- Added basic, runner, tank, and elite monsters.
- Tank monsters have 2 HP and 2 XP.
- Tank monsters move slower while shielded, then return to normal speed after shield breaks.
- Added combo multiplier bar from X1 to X5.
- Kills add combo XP based on monster type.
- Score is multiplied by current combo level.
- Single mistake downgrades combo by one level and resets combo XP.
- Two mistakes in a row reset combo to X1.
- Laser color changes based on current combo multiplier.
- Added generated sound effects for laser, monster death, multiplier increase, typing, and errors.
- Added simple retro arcade background soundtrack.

### Needs Testing
- Monster type spawn balance by stage.
- Tank shield speed behavior.
- Combo XP thresholds and penalty fairness.
- Score scaling with combo.
- Laser color clarity across multipliers.
- Sound volume and soundtrack fatigue.
- Performance with audio and higher monster counts.

### Validation Status
- Pending.

---

## V2.1 — UI cleanup and start instructions

### Built
- Added initial instruction/start screen
- Removed text below the game board
- Slightly increased row height
- Fixed combo multiplier label visibility after X1
- Removed next-multiplier text beside combo bar

### Needs Testing
- Start screen Enter flow
- Combo display from X1 through X5
- Row readability after height increase
- No bottom UI text remains

---

## V2.2

### Built
- Extended the playable grid horizontally.
- Moved monster spawn position inside the visible play area.
- Changed spawning to use spawn delays instead of far-offscreen starting positions.
- Balanced monster distribution across lanes during stage setup.
- Prevented duplicate words across active lanes.
- Prevented the same lane from receiving the same word again immediately.

### Needs Testing
- Monsters should appear soon after spawning instead of traveling invisibly.
- Wider grid should still leave lane words readable.
- Monster types should feel evenly distributed across lanes.
- No duplicate words should appear across lanes at the same time.
- Completed lane words should not repeat immediately in that lane.
