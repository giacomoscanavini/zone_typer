# Zone Typer

Zone Typer is a web-native typing defense game born during the 2026 Tencent Cloud Day Hackathon in Hong Kong

The concept of the game is relatively simple, the player has to protect their zone before it is breached by monsters approaching it

By typing correctly the random words in each lane, the player can shoot projectiles at the monsters gaining points and increasing their score multiplicator

Clearing a stage allows the player to gain up to three power-ups to fight the waves

This project was born in a hackathon so it is intentionally lightweight

The game runs directly in the browser through an HTML file, but it is entirely built in JavaScript

## How to Play
The game only requires the keyboard to play:
1. Press `Enter` to start a new game
2. Type the words in a specific lane
3. Select a power-up at each stage clear by pressing `1`, `2`, or `3`
4. Use owned power-ups by typing their keywords

## Project Structure
```text
zone_typer/
├── index.html              # Browser entry point and script load order
├── style.css               # Page and canvas styling
├── assets/
│   ├── zone-typer-thumbnail.webp
│   └── sprites/            # Monster sprite images
└── js/
    ├── foundation.js       # Canvas handles, constants, shared game state, helpers
    ├── words.js            # Word pools by difficulty tier
    ├── monsters.js         # Monster type metadata and sprite loading
    ├── audio.js            # Web Audio helpers, effects, and music loop
    ├── stage.js            # Stage scaling, lane setup, word choice, telemetry
    ├── powerups.js         # Power-up inventory, activation, and word effects
    ├── combat.js           # Combo logic, lasers, scoring, monster kills
    ├── input.js            # Keyboard input and typing validation
    ├── update.js           # Timers, movement, stage completion, projectile updates
    ├── render.js           # Canvas drawing and overlays
    └── main.js             # Game bootstrap and animation loop start
```

## Development Background

The original game design, monster properties, power-up, and basic mechanics were built during the hackathon

The graphical and sound components were largely enhanced with the help of AI

1. The game is created with HTML, CSS, and JavaScript. The reasons for these tools are two: I don't have much experience coding games and since I have worked with websites before these are the tools I knew could do the job. The game can this way be played instantly in the browser

2. The game must contain a sense of progression and reward. A reason to keep playing the game is the covert improvement in typing accuracy that allows the player to clear more waves while playing the game, players are visually and auditory rewarded by increasing the score and score multiplier over consecutive successful shots. The game progresses with more lanes, more monsters, different monsters, and speed increase over time. The difficulty ramp is hardcoded in the game up to stage 25, after which it remains constantly very hard with mostly elite monsters. Athough the game becomes almost impossible to play toward later stages, the change in complexity is somewhat linear. In addition the player is given the choice of what power-ups to use and when to use them based on how the game is evolving

3. Game launch. 
    - `index.html` loads the JavaScript scritps
    - `main.js` runs restartGame() and requestAnimaitonFrame()
        - creates the canvas
        - creates global GAME state object
        - reset score, stage, combo, powers, and telemetry
        - builds board with monster lanes
        - starts the animation loop
    - ENTER key is pressed
        - ensureAudio() runs
        - sets GAME.gameStarted = true
    - Game loop updates gameplay, every frame it calls
        - update(df)
            Once the game has started, `update.js` advances the world
            - It updates timers
            - Updates music with `updateMusic(dt)`
            - It handles monster spawning
            - It moves active monsters
            - It updates lasers
            - It cleans up expired objects
        - render()
            - Draws objects at their current location (whether they moved or not)

4. Combat. `input.js` builds a temporary input string based on what the player types, if the input string is a valid prefix of any lane word or power-up. findCompletedLane() finds the matching lane and 
fireLaser(completedLane) shoots a laser projectile.

5. Losing the game. The game checks the monsters' positions to see if they have reached GAME.protectedZoneX, if so sets GAME.gameOver = true

6. Stage clear and difficulty scaling. If all monsters in a stage are defeated, the game sets GAME.stage += 1 and startStage() creates the successive stage
    - laneCountForStage(stage) controls how many lanes exist
    - monsterCountForStage(stage) controls how many monsters appear
    - baseSpeedForStage(stage) controls how fast monsters move
    - pickMonsterType(stage) controls which monster types appear
    - stageWordRules(stage) controls word complexity
