# Archero Legends

A mobile dungeon-crawler game inspired by Archero, built with **Phaser 3** + **Capacitor** + **TypeScript**.

## Features

- **Top-down auto-attack combat** with joystick movement (move to dodge, stand still to auto-shoot)
- **Dungeon room progression** with enemy waves and boss fights every 5 rooms
- **Level-up ability system** — choose 1 of 3 random upgrades per level (multishot, piercing, ricochet, poison, freeze, orbitals, and more)
- **4 playable heroes** with unique abilities (Archer, Ranger, Knight, Mage)
- **Equipment system** with weapons, armor, rings, and pendants across 4 rarity tiers
- **Meta-progression** — earn gold, unlock heroes, and buy equipment between runs
- **3 dungeon chapters** with unique enemy types and bosses
- **Procedurally generated vector/cartoon art** (no external assets needed)

## Tech Stack

- **Phaser 3** — 2D game engine (physics, sprites, animations)
- **TypeScript** — type-safe game logic
- **Vite** — fast dev server and build tool
- **Capacitor** — native iOS/Android deployment

## Getting Started

```bash
npm install
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build to dist/
```

## Mobile Deployment

```bash
npm run build
npx cap add android   # or: npx cap add ios
npx cap sync
npx cap open android  # Opens in Android Studio
npx cap open ios      # Opens in Xcode
```

## Game Controls

- **Touch/drag** left side of screen to move (virtual joystick)
- **Stand still** to auto-attack the nearest enemy
- **Tap** ability cards during level-up to choose upgrades

## Project Structure

```
src/
  main.ts              # Game config and entry point
  data/GameData.ts     # All game data (heroes, abilities, enemies, equipment)
  entities/Player.ts   # Player entity with stats and abilities
  entities/Enemy.ts    # Enemy entity with AI behaviors
  systems/CombatSystem.ts    # Projectile and damage system
  systems/JoystickSystem.ts  # Virtual joystick input
  scenes/              # Phaser scenes (Boot, Menu, Game, LevelUp, etc.)
  ui/HUD.ts            # In-game heads-up display
  utils/               # Save manager, asset generator
```
