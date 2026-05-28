# Zone Typers — Full Development Roadmap

## Project Overview

### Core Concept

Zone Typers is a browser-playable 2D arcade-vibe lane-defense typing game

The player protects a zone while monsters advance through multiple lanes. The player can shoot to kill monsters by typing correctly the word in each lane which will trigger a fire attack into that lnae

The game is divided into phases and includes the following escalating mechanics:
* increasing enemy count
* increasing enemy speed
* new enemy behaviors
* additional lanes spawn
* additional cognitive pressure with increased number of items to track
* strategic power-ups at the end of each phase
* increased complexity of words to type

The game only requires input from the keyboard

### Core Design Pillars

Players choices:
* which lane to prioritize
* use of power-ups

Random components: 
* spawn location of monsters
* words associated to a lane

### Why Playing this Game

By focusing on accuracy rather than speed the game allows to improve typing skills

The game comes with a rewarding aspects of dopamine:
* lasers shooting
* sounds effects
* visual feedback
* enemy destruction
* game progression with complexity and challenges

### Technical Stack

* Engine: Phaser.js
* Platform: Browser
* Rendering: HTML5 Canvas
* Language: JavaScript

### Version Numbering

Big additions to the game features come in a new version that resets the second number vX.0
Changes to current features come in a new version that increments the second nubmer v1.Y

---
