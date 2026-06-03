import { Platform } from '../objects/Platform.js';
import { Wall } from '../objects/Wall.js';
import { Player } from '../objects/Player.js';
import { Walker } from '../objects/Walker.js';
import { Archer } from '../objects/Archer.js';
import { Flyer } from '../objects/Flyer.js';
import { ArrowPickup } from '../objects/Pickup.js';
import { FallingSpike } from '../objects/Hazard.js';
import { Checkpoint } from '../objects/Checkpoint.js';
import { LabelSign } from '../objects/LabelSign.js';
import { Door } from '../objects/Door.js';
import { LevelBackground } from '../objects/LevelBackground.js';

// LevelManager — the single, reusable level system. Given a level config it
// handles, in clearly separated steps:
//   - level clearing      (old entities + checkpoint state + music)
//   - checkpoint handling  (per-level spawn + reset)
//   - background handling   (sprite or solid-color placeholder)
//   - object loading        (platforms, enemies, hazards, checkpoints, door)
//   - player spawning       (fresh Player -> resets HP/ammo automatically)
//   - camera reset          (bounds + snap to the new spawn)
//   - music handling        (per-level track via AudioManager)
//
// It does NOT touch player physics tuning — only level structure/contents.
export class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentBounds = null;
  }

  load(level) {
    const g = this.game;

    // ---- level clearing ----
    g.checkpoints.reset();
    g.entities.clear();

    // ---- checkpoint handling (per-level spawn) ----
    g.checkpoints.setSpawn(level.spawn.x, level.spawn.y);

    // ---- camera bounds ----
    const bounds = this._deriveBounds(level);
    this.currentBounds = bounds;
    g.cameraFollow.setBounds(bounds);

    // ---- background handling ----
    g.entities.add(new LevelBackground({ bounds, ...(level.background || {}) }));

    // ---- object loading ----
    for (const obj of level.objects || []) {
      this._spawnObject(obj);
    }

    // ---- player spawning (fresh instance => HP/ammo/lives reset) ----
    g.player = new Player({ x: level.spawn.x, y: level.spawn.y });
    g.player.godMode = !!g.debugFlags.godMode;
    g.entities.add(g.player);

    // ---- camera reset (snaps to the new player) ----
    g.cameraFollow.setTarget(g.player);

    // ---- music handling ----
    g.audio.play(level.music);
  }

  _spawnObject(obj) {
    const g = this.game;
    switch (obj.type) {
      case 'platform':    g.entities.add(new Platform(obj)); break;
      case 'wall':        g.entities.add(new Wall(obj)); break;
      case 'walker':      g.entities.add(new Walker(obj)); break;
      case 'archer':      g.entities.add(new Archer(obj)); break;
      case 'flyer':       g.entities.add(new Flyer(obj)); break;
      case 'arrowPickup': g.entities.add(new ArrowPickup(obj)); break;
      case 'spike':       g.entities.add(new FallingSpike(obj)); break;
      case 'checkpoint':  g.entities.add(new Checkpoint(obj)); break;
      case 'label':       g.entities.add(new LabelSign(obj)); break;
      case 'door':        g.entities.add(new Door(obj)); break;
      default: break;
    }
  }

  _deriveBounds(level) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const obj of level.objects || []) {
      if (typeof obj.x !== 'number' || typeof obj.y !== 'number') continue;
      if (typeof obj.w !== 'number' || typeof obj.h !== 'number') continue;
      minX = Math.min(minX, obj.x - obj.w / 2);
      maxX = Math.max(maxX, obj.x + obj.w / 2);
      minY = Math.min(minY, obj.y - obj.h / 2);
      maxY = Math.max(maxY, obj.y + obj.h / 2);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return { minX: -18, maxX: 18, minY: -2, maxY: 52 };
    }

    const padX = 0.5;
    const padY = 0.5;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }
}
