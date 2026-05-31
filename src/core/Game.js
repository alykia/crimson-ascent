import { Renderer } from './Renderer.js';
import { Loop } from './Loop.js';
import { Input } from './Input.js';
import { StateMachine, STATES } from './StateMachine.js';
import { EntityManager } from '../systems/EntityManager.js';
import { Physics } from '../systems/Physics.js';
import { CameraFollow } from '../systems/CameraFollow.js';
import { CheckpointSystem } from '../systems/CheckpointSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { Hud } from '../ui/Hud.js';
import { MobileControls } from '../ui/MobileControls.js';
import { MenuTitle } from '../ui/MenuTitle.js';
import { TutorialPopup } from '../ui/TutorialPopup.js';
import { DebugMenu } from '../ui/DebugMenu.js';
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
import { LevelBackground } from '../objects/LevelBackground.js';
import { getLevelById } from '../config/levels.js';
import { readRuntimeFlags } from '../config/runtimeFlags.js';
import { WORLD, PLAYER } from '../config/constants.js';

const TUTORIAL_STORAGE_KEY = 'crimson_ascent_tutorial_seen';

// Top-level orchestrator. Owns the scene (via Renderer), all systems, and the
// game loop. Phase 1 ships with a static graybox level and no player yet.
// Subsequent phases attach Player, enemies, hazards, etc.
export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;

    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.input.attach();
    this.state = new StateMachine(STATES.BOOT);
    this.entities = new EntityManager(this.renderer.scene);
    this.physics = new Physics(this.entities);
    this.cameraFollow = new CameraFollow(this.renderer.camera);
    this.checkpoints = new CheckpointSystem();
    this.hud = new Hud(uiRoot);
    this.mobile = new MobileControls(uiRoot, this.input);
    this.debug = new DebugOverlay(uiRoot);
    this.runtimeFlags = readRuntimeFlags();

    this.player = null;
    this.currentLevelId = null;
    this.currentLevel = null;
    this.debugFlags = {
      godMode: false,
    };

    // Hit-pause / freeze-frame counter. While > 0 entity updates are skipped
    // (the world freezes). Set via freezePhysics(ms) — used by dash impact.
    this._freezeMs = 0;

    this.input.on('toggleDebug', () => this.debug.toggle());
    this.input.on('restart', () => this._handleRestart());
    this.input.on('toggleDevMenu', () => this.debugMenu.toggle());
    this.input.on('toggleGodMode', () => this.toggleGodMode());
    this.input.on('refillHp', () => this.refillHp());
    this.input.on('refillAmmo', () => this.refillAmmo());
    this.input.on('reloadLevel', () => this.reloadCurrentLevel());

    this.menuTitle = new MenuTitle(uiRoot, {
      zooEnabled: this.runtimeFlags.zooEnabled,
      onStartGame: () => this.requestStartCampaign(),
      onOpenTutorial: () => this.showTutorialFromMenu(),
      onEnterZoo: () => this.enterZoo(),
    });
    this.tutorialPopup = new TutorialPopup(uiRoot);

    this.debugMenu = new DebugMenu(uiRoot, {
      onToggleGodMode: () => this.toggleGodMode(),
      onRefillHp: () => this.refillHp(),
      onRefillAmmo: () => this.refillAmmo(),
      onReloadLevel: () => this.reloadCurrentLevel(),
      onTeleportAnchor: (id) => this.teleportToAnchor(id),
    });
    this.debugMenu.setAvailable(false);

    this.loop = new Loop(
      (dt) => this.update(dt),
      () => this.render()
    );

    this._gotoMenu();
  }

  _loadLevel(level) {
    this.entities.clear();
    this.checkpoints.setSpawn(level.spawn.x, level.spawn.y);
    const levelBounds = this._deriveLevelBounds(level);
    this.entities.add(new LevelBackground({ bounds: levelBounds }));
    for (const obj of level.objects) {
      switch (obj.type) {
        case 'platform': this.entities.add(new Platform(obj)); break;
        case 'wall':     this.entities.add(new Wall(obj)); break;
        case 'walker':   this.entities.add(new Walker(obj)); break;
        case 'archer':   this.entities.add(new Archer(obj)); break;
        case 'flyer':    this.entities.add(new Flyer(obj)); break;
        case 'arrowPickup': this.entities.add(new ArrowPickup(obj)); break;
        case 'spike':       this.entities.add(new FallingSpike(obj)); break;
        case 'checkpoint':  this.entities.add(new Checkpoint(obj)); break;
        case 'label':       this.entities.add(new LabelSign(obj)); break;
      }
    }
    // Player added last so it renders on top and the static solids are in
    // place when its first physics query runs.
    this.player = new Player({ x: level.spawn.x, y: level.spawn.y });
    this.player.godMode = !!this.debugFlags.godMode;
    this.entities.add(this.player);
    this.cameraFollow.setTarget(this.player);
  }

  _deriveLevelBounds(level) {
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

  _gotoMenu() {
    this.state.set(STATES.MENU);
    this.menuTitle.setZooEnabled(this.runtimeFlags.zooEnabled);
    this.menuTitle.show();
    this.tutorialPopup.hide();
    this.hud.setVisible(false);
    this.mobile.setGameplayEnabled(false);
    this.debugMenu.hide();
    this.debugMenu.setAvailable(false);
  }

  _setLevel(levelId) {
    const level = getLevelById(levelId);
    this.currentLevelId = levelId;
    this.currentLevel = level;
    this._loadLevel(level);
    this.state.set(STATES.PLAYING);
    this.menuTitle.hide();
    this.tutorialPopup.hide();
    this.hud.setVisible(true);
    this.mobile.setGameplayEnabled(true);
    this.debugMenu.setAvailable(levelId === 'zoo');
    this.debugMenu.setState({
      levelName: level.title || level.name || levelId,
      godMode: this.debugFlags.godMode,
      anchors: level.debugAnchors || [],
    });
  }

  startCampaign() {
    this._setLevel('campaign');
  }

  requestStartCampaign() {
    if (this._hasSeenTutorial()) {
      this.startCampaign();
      return;
    }

    this._openTutorial({
      onClose: () => {
        this._markTutorialSeen();
        this.startCampaign();
      },
    });
  }

  showTutorialFromMenu() {
    this._openTutorial({
      onClose: () => {
        this._markTutorialSeen();
        this._gotoMenu();
      },
    });
  }

  _openTutorial({ onClose }) {
    this.state.set(STATES.TUTORIAL);
    this.menuTitle.show();
    this.hud.setVisible(false);
    this.mobile.setGameplayEnabled(false);
    this.debugMenu.hide();
    this.debugMenu.setAvailable(false);
    this.tutorialPopup.show({ onClose });
  }

  _hasSeenTutorial() {
    try {
      return window.localStorage?.getItem(TUTORIAL_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  _markTutorialSeen() {
    try {
      window.localStorage?.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch {
      // Private browsing or storage restrictions should not block play.
    }
  }

  enterZoo() {
    if (!this.runtimeFlags.zooEnabled) return;
    this._setLevel('zoo');
  }

  _handleRestart() {
    if (!this.state.is(STATES.PLAYING)) return;
    this.respawn();
  }

  // Triggered by R, death plane, or hp depletion. Resettable entities
  // (enemies, hazards) get an onPlayerRespawn() hook so they can revive /
  // retract for the retry.
  respawn() {
    if (!this.player) return;
    const p = this.checkpoints.respawnPoint();
    this.player.respawn(p.x, p.y);
    this.player.godMode = !!this.debugFlags.godMode;
    this.entities.forEach(e => { if (e.onPlayerRespawn) e.onPlayerRespawn(); });
    if (this.cameraFollow.target) this.cameraFollow.snap();
  }

  toggleGodMode() {
    if (!this.debugMenu.available) return;
    this.debugFlags.godMode = !this.debugFlags.godMode;
    if (this.player) this.player.godMode = this.debugFlags.godMode;
    this.debugMenu.setState({
      levelName: this.currentLevel?.title || this.currentLevelId,
      godMode: this.debugFlags.godMode,
      anchors: this.currentLevel?.debugAnchors || [],
    });
  }

  refillHp() {
    if (!this.debugMenu.available) return;
    if (!this.player) return;
    this.player.refillHp();
  }

  refillAmmo() {
    if (!this.debugMenu.available) return;
    if (!this.player) return;
    this.player.refillAmmo();
  }

  reloadCurrentLevel() {
    if (!this.debugMenu.available) return;
    if (!this.currentLevelId) return;
    this._setLevel(this.currentLevelId);
  }

  teleportToAnchor(anchorId) {
    if (!this.debugMenu.available || !this.player) return;
    const anchors = this.currentLevel?.debugAnchors || [];
    const anchor = anchors.find((a) => a.id === anchorId);
    if (!anchor) return;
    this.player.respawn(anchor.x, anchor.y);
    this.player.godMode = !!this.debugFlags.godMode;
    this.cameraFollow.snap();
  }

  start() {
    this.loop.start();
  }

  // Brief world freeze used for hit-pause / dash-impact feedback. Stacks via
  // max() so a long freeze isn't shortened by a later small one.
  freezePhysics(ms) {
    if (ms > this._freezeMs) this._freezeMs = ms;
  }

  // Resolves player-enemy AABB overlaps each frame:
  //   - dashing + (no weaken required OR weakened) -> enemy dies, dash refreshed
  //   - otherwise -> player takes damage (knocked back away from enemy)
  _resolveCombat() {
    const p = this.player;
    if (!p) return;
    const enemies = this.entities.filter(e => e.isEnemy && !e.dead);
    for (const e of enemies) {
      if (!Physics.overlap(p.aabb, e.aabb)) continue;
      const dashing = p.dashMsLeft > 0;
      const canDie = !e.requireWeakened || e.weakened;
      if (dashing && canDie) {
        e.kill();
        p.canDash = true;
        p.dashMsLeft = 0;
        this.freezePhysics(PLAYER.DASH_FREEZE_MS);
      } else {
        const fromDir = Math.sign(e.aabb.x - p.aabb.x) || 1;
        p.damage(fromDir);
      }
    }
  }

  update(dt) {
    if (this.state.is(STATES.MENU) || this.state.is(STATES.TUTORIAL)) {
      this.debug.update(dt, this);
      this.input.endFrame();
      return;
    }

    if (this.state.is(STATES.PAUSE)) {
      this.input.endFrame();
      return;
    }

    if (this._freezeMs > 0) {
      this._freezeMs = Math.max(0, this._freezeMs - dt * 1000);
      // World frozen but renderer still draws and input still drains so we
      // don't lose any presses across the pause.
      this.input.endFrame();
      return;
    }

    this.entities.update(dt, this);
    this._resolveCombat();

    // HP depleted -> respawn.
    if (this.player && this.player.hp <= 0) {
      this.respawn();
      this.input.endFrame();
      return;
    }
    // Fell off the world.
    if (this.player && this.player.aabb.y < WORLD.DEATH_Y) {
      this.respawn();
    }

    this.cameraFollow.update(dt);
    this.hud.update(dt, this);
    this.debugMenu.setState({
      levelName: this.currentLevel?.title || this.currentLevelId,
      godMode: this.debugFlags.godMode,
      anchors: this.currentLevel?.debugAnchors || [],
    });
    this.debug.update(dt, this);
    this.input.endFrame();
  }

  render() {
    this.renderer.render();
  }
}
