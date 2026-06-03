import { Renderer } from './Renderer.js';
import { Loop } from './Loop.js';
import { Input } from './Input.js';
import { StateMachine, STATES } from './StateMachine.js';
import { EntityManager } from '../systems/EntityManager.js';
import { Physics } from '../systems/Physics.js';
import { CameraFollow } from '../systems/CameraFollow.js';
import { CheckpointSystem } from '../systems/CheckpointSystem.js';
import { LevelManager } from '../systems/LevelManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { Hud } from '../ui/Hud.js';
import { MobileControls } from '../ui/MobileControls.js';
import { MenuTitle } from '../ui/MenuTitle.js';
import { TutorialPopup } from '../ui/TutorialPopup.js';
import { Transition } from '../ui/Transition.js';
import { getLevelById, FIRST_LEVEL_ID } from '../config/levels.js';
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
    this.audio = new AudioManager();
    this.levelManager = new LevelManager(this);
    this.hud = new Hud(uiRoot);
    this.mobile = new MobileControls(uiRoot, this.input);
    this.transition = new Transition(uiRoot);
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

    // True while a level-exit fade is playing. Freezes the world and disables
    // player input (keyboard + mobile) until the next level has loaded.
    this._transitioning = false;

    this.input.on('restart', () => this._handleRestart());
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

    this.loop = new Loop(
      (dt) => this.update(dt),
      () => this.render()
    );

    this._gotoMenu();
  }

  _gotoMenu() {
    this.state.set(STATES.MENU);
    this.audio.stop();
    this.menuTitle.setZooEnabled(this.runtimeFlags.zooEnabled);
    this.menuTitle.show();
    this.tutorialPopup.hide();
    this.hud.setVisible(false);
    this.mobile.setGameplayEnabled(false);
  }

  _setLevel(levelId) {
    const level = getLevelById(levelId);
    this.currentLevelId = level.id || levelId;
    this.currentLevel = level;
    this.levelManager.load(level);
    this.state.set(STATES.PLAYING);
    this.menuTitle.hide();
    this.tutorialPopup.hide();
    this.hud.setVisible(true);
    this.mobile.setGameplayEnabled(true);
  }

  startCampaign() {
    this._setLevel(FIRST_LEVEL_ID);
  }

  // Triggered when the player enters a level's exit door. Plays a pixel fade,
  // loads the level's nextLevelId off-screen (or returns to menu when null),
  // then fades back in. The world is frozen and input disabled throughout.
  advanceLevel() {
    if (this._transitioning) return;
    if (!this.state.is(STATES.PLAYING)) return;

    const nextId = this.currentLevel?.nextLevelId || null;
    this._transitioning = true;

    this.transition.fadeOut(() => {
      if (nextId) {
        this._setLevel(nextId);
      } else {
        // Last level cleared -> back to the menu.
        this._gotoMenu();
      }
      this.transition.fadeIn(() => {
        this._transitioning = false;
      });
    });
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
    this.tutorialPopup.show({ onClose });
  }

  _debugCommandsEnabled() {
    return this.state.is(STATES.PLAYING) && this.currentLevelId === 'zoo';
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
    if (!this._debugCommandsEnabled()) return;
    this.debugFlags.godMode = !this.debugFlags.godMode;
    if (this.player) this.player.godMode = this.debugFlags.godMode;
  }

  refillHp() {
    if (!this._debugCommandsEnabled()) return;
    if (!this.player) return;
    this.player.refillHp();
  }

  refillAmmo() {
    if (!this._debugCommandsEnabled()) return;
    if (!this.player) return;
    this.player.refillAmmo();
  }

  reloadCurrentLevel() {
    if (!this._debugCommandsEnabled()) return;
    if (!this.currentLevelId) return;
    this._setLevel(this.currentLevelId);
  }

  teleportToAnchor(anchorId) {
    if (!this._debugCommandsEnabled() || !this.player) return;
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
      this.input.endFrame();
      return;
    }

    if (this.state.is(STATES.PAUSE)) {
      this.input.endFrame();
      return;
    }

    // Level-exit fade in progress: freeze the world and drain input so neither
    // keyboard nor mobile presses leak across the transition.
    if (this._transitioning) {
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
    this.input.endFrame();
  }

  render() {
    this.renderer.render();
  }
}
