# Crimson Ascent

2D vertical precision platformer graybox prototype. Three.js + Vite.

> "Climb. Die. Climb again, cleaner."

**Play it:** https://alykia.github.io/crimson-ascent/

## Quick start

```bash
cd CrimsonAscent
npm install
npm run dev
```

Open http://localhost:5174.

## Controls (keyboard)

| Action | Keys |
| --- | --- |
| Move | A / D or Left / Right |
| Aim up/down | W / S or Up / Down |
| Jump (variable height) | Space |
| Dash | Shift or J |
| Shoot arrow | K or X |
| Restart | R |
| Toggle debug overlay | B |

Mobile controls land in Phase 10.

## Tuning

All movement, combat, and physics numbers live in [src/config/constants.js](src/config/constants.js). Vite HMR keeps the page live as you tweak.

## Project layout

```
CrimsonAscent/
  index.html
  vite.config.js
  package.json
  DevPlanCrim.md
  src/
    main.js
    style.css
    config/      constants, colors, level data
    core/        Game, Loop, Renderer, Input, StateMachine
    systems/     Physics, EntityManager, CameraFollow, CheckpointSystem, DebugOverlay
    objects/     Player, Platform, Wall, Hazard, Enemy, Arrow, Pickup, Checkpoint
    ui/          Hud, MobileControls
```

## Build & deploy

```bash
npm run build        # outputs dist/
npm run preview      # serve dist/ locally
```

Deploys are automatic: every push to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. You can also run the workflow manually from the Actions tab.

## Development phases

See [DevPlanCrim.md](DevPlanCrim.md) for the full plan. Implementation order:

1. Project setup (this commit)
2. Core player controller — **playtest gate A**
3. Dash attack
4. Health & damage — **playtest gate B**
5. Enemy systems
6. Arrow system
7. Falling spikes — **playtest gate C**
8. Full checkpoint system
9. Camera follow polish
10. Mobile controls
11. Vertical level design
