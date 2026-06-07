import * as THREE from 'three';
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
import { audio as sfx } from '../systems/SfxManager.js';
import { Hud } from '../ui/Hud.js';
import { BossHud } from '../ui/BossHud.js';
import { MobileControls } from '../ui/MobileControls.js';
import { MenuTitle } from '../ui/MenuTitle.js';
import { TutorialPopup } from '../ui/TutorialPopup.js';
import { GameCompletePopup } from '../ui/GameCompletePopup.js';
import { Transition } from '../ui/Transition.js';
import { ChallengeMode } from '../systems/ChallengeMode.js';
import { ChallengeTimer } from '../ui/ChallengeTimer.js';
import { ChallengeSelectPopup } from '../ui/ChallengeSelectPopup.js';
import { ChallengeCompletePopup } from '../ui/ChallengeCompletePopup.js';
import { RankingPopup } from '../ui/RankingPopup.js';
import { ConfirmPopup } from '../ui/ConfirmPopup.js';
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
    // Sound effects (kept separate from music). Begin decoding now; the manager
    // resumes its audio context on the first user gesture (mobile/desktop).
    this.sfx = sfx;
    this.sfx.loadSfx();
    this.levelManager = new LevelManager(this);
    this.hud = new Hud(uiRoot);
    this.bossHud = new BossHud(uiRoot);
    this.mobile = new MobileControls(uiRoot, this.input);
    this.transition = new Transition(uiRoot);
    this.gameComplete = new GameCompletePopup(uiRoot, {
      onRestart: () => this._restartFromComplete(),
      onMenu: () => this._menuFromComplete(),
      onChallenge: () => this.openChallengeSelect('complete'),
    });

    // ---- Challenge Mode (timed runs + local leaderboard) ----
    this.currentGameMode = 'normal'; // 'normal' | 'challenge'
    this.challengeType = null; // 'level1' | 'level2' | 'all'
    this.challenge = new ChallengeMode();
    this.challengeTimer = new ChallengeTimer(uiRoot);
    this.challengeSelect = new ChallengeSelectPopup(uiRoot, {
      onSelect: (type) => this.startChallenge(type),
      onBack: () => this._closeChallengeSelect(),
    });
    this.challengeComplete = new ChallengeCompletePopup(uiRoot, {
      onRestart: () => this.restartChallenge(),
      onMenu: () => this._menuFromChallenge(),
    });
    this.rankingPopup = new RankingPopup(uiRoot, {
      onBack: () => this._closeRanking(),
    });
    this.confirmPopup = new ConfirmPopup(uiRoot);
    // Where the selection popup returns to when Back is pressed ('menu' or
    // 'complete'), set each time it is opened.
    this._challengeBackTo = 'menu';

    this.runtimeFlags = readRuntimeFlags();

    this.player = null;
    this.currentLevelId = null;
    this.currentLevel = null;

    // The active reward chest (boss-defeat reward). When set, a click/tap that
    // lands on it opens it. Cleared on level load / menu / restart.
    this.activeChest = null;
    this._pointer = new THREE.Vector3();
    this.debugFlags = {
      godMode: false,
    };

    // Hit-pause / freeze-frame counter. While > 0 entity updates are skipped
    // (the world freezes). Set via freezePhysics(ms) — used by dash impact.
    this._freezeMs = 0;

    // True while a level-exit fade is playing. Freezes the world and disables
    // player input (keyboard + mobile) until the next level has loaded.
    this._transitioning = false;
    this._playMenuOpen = false;

    // Pointer pick for the reward chest (works for mouse + touch via pointer
    // events). Taps on mobile controls hit their own DOM nodes, not the canvas.
    this._onPointerDown = (e) => this._handlePointerDown(e);
    this.canvas.addEventListener('pointerdown', this._onPointerDown);

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
      onOpenChallenge: () => this.openChallengeSelect('menu'),
      onOpenRanking: () => this.openRanking(),
      onBackToMenu: () => this._confirmExitChallenge(),
      sfxMuted: this.sfx.sfxMuted,
      sfxVolume: this.sfx.sfxVolume,
      musicMuted: this.audio.musicMuted,
      musicVolume: this.audio.musicVolume,
      onToggleSfxMute: () => this.sfx.toggleSfxMute(),
      onToggleMusicMute: () => this.audio.toggleMusicMute(),
      onSetSfxVolume: (v) => this.sfx.setSfxVolume(v),
      onSetMusicVolume: (v) => this.audio.setMusicVolume(v),
    });
    this._createPlayMenuButton(uiRoot);
    this._createBossTestButton(uiRoot);
    this.tutorialPopup = new TutorialPopup(uiRoot);

    this.loop = new Loop(
      (dt) => this.update(dt),
      () => this.render()
    );

    this._gotoMenu();
  }

  _gotoMenu() {
    this._playMenuOpen = false;
    // Leaving any active challenge run: drop back to normal mode and stop/hide
    // the timer so it never runs on the menu.
    this.currentGameMode = 'normal';
    this.challengeType = null;
    this.challenge.end();
    this.state.set(STATES.MENU);
    this.audio.stop();
    this.menuTitle.setZooEnabled(this.runtimeFlags.zooEnabled);
    this.menuTitle.setStartLabel('START');
    this.menuTitle.show();
    // Challenge + Ranking show on the main menu only once unlocked. The pause-only
    // "Back to Menu" button is never shown on the actual main menu.
    this.menuTitle.setChallengeUnlocked(ChallengeMode.isUnlocked(), ChallengeMode.isNew());
    this.menuTitle.setBackToMenuVisible(false);
    this._setPlayMenuButtonVisible(false);
    this._setPlayMenuButtonOpen(false);
    this.tutorialPopup.hide();
    this.bossHud.hide();
    this.gameComplete.hide();
    this.challengeTimer.hide();
    this.challengeSelect.hide();
    this.challengeComplete.hide();
    this.rankingPopup.hide();
    this.confirmPopup.hide();
    this.activeChest = null;
    this._setBossTestButtonVisible(false);
    this.hud.setVisible(false);
    this.mobile.setGameplayEnabled(false);
  }

  _setLevel(levelId) {
    const level = getLevelById(levelId);
    this.currentLevelId = level.id || levelId;
    this.currentLevel = level;
    this.levelManager.load(level);
    this._playMenuOpen = false;
    this.state.set(STATES.PLAYING);
    this.menuTitle.hide();
    this.menuTitle.setStartLabel('START');
    this._setPlayMenuButtonVisible(true);
    this._setPlayMenuButtonOpen(false);
    this.tutorialPopup.hide();
    // Boss-fight UI starts clean on every level load (boss re-shows its own bar
    // when it triggers). Any leftover chest reference is dropped.
    this.bossHud.hide();
    this.gameComplete.hide();
    this.activeChest = null;
    // Show the boss-test shortcut only on levels that define a target.
    this._setBossTestButtonVisible(!!level.bossTestSpawn);
    this.hud.setVisible(true);
    this.mobile.setGameplayEnabled(true);
  }

  startCampaign() {
    // Normal mode: ensure no challenge run/timer carries over.
    this.currentGameMode = 'normal';
    this.challengeType = null;
    this.challenge.end();
    this.challengeTimer.hide();
    this._setLevel(FIRST_LEVEL_ID);
  }

  // Starts a timed Challenge run of the given type ('level1' | 'level2' | 'all').
  // Reuses the normal level configs; only the run timer + completion handling
  // differ. The timer begins as soon as the level loads (PLAYING).
  startChallenge(type) {
    this.challengeSelect.hide();
    this.gameComplete.hide();
    this.menuTitle.hide();
    this.challengeComplete.hide();
    this.rankingPopup.hide();

    this.currentGameMode = 'challenge';
    this.challengeType = type;
    this.challenge.begin(type);
    this._setLevel(this.challenge.startLevelFor(type));
    this.challengeTimer.setTime(0);
    this.challengeTimer.show();
  }

  _createPlayMenuButton(uiRoot) {
    this.playMenuBtn = document.createElement('button');
    this.playMenuBtn.type = 'button';
    this.playMenuBtn.id = 'play-menu-button';
    this.playMenuBtn.setAttribute('aria-label', 'Open menu');
    this.playMenuBtn.setAttribute('aria-expanded', 'false');
    this.playMenuBtn.addEventListener('click', () => this.togglePlayMenu());
    uiRoot.appendChild(this.playMenuBtn);
    this._setPlayMenuButtonVisible(false);
  }

  _setPlayMenuButtonVisible(visible) {
    if (!this.playMenuBtn) return;
    this.playMenuBtn.style.display = visible ? 'flex' : 'none';
  }

  // Dev/testing shortcut: a button that jumps to the boss arena. Only shown on
  // levels whose config provides a `bossTestSpawn`.
  _createBossTestButton(uiRoot) {
    this.bossTestBtn = document.createElement('button');
    this.bossTestBtn.type = 'button';
    this.bossTestBtn.id = 'boss-test-button';
    this.bossTestBtn.textContent = 'Boss Test';
    this.bossTestBtn.addEventListener('click', () => this.teleportToBossTest());
    uiRoot.appendChild(this.bossTestBtn);
    this._setBossTestButtonVisible(false);
  }

  _setBossTestButtonVisible(visible) {
    if (!this.bossTestBtn) return;
    this.bossTestBtn.style.display = visible ? 'flex' : 'none';
  }

  // Teleport the player just below the arena deck and re-arm the encounter so
  // the one-way jump-through and fight trigger can be tested repeatedly.
  teleportToBossTest() {
    const target = this.currentLevel?.bossTestSpawn;
    if (!target || !this.player) return;
    if (!this.state.is(STATES.PLAYING) || this._transitioning) return;
    // Lift like a normal respawn so we never spawn embedded in a platform.
    this.player.respawn(target.x, target.y + WORLD.RESPAWN_LIFT);
    this.player.godMode = !!this.debugFlags.godMode;
    // Run the same retry-reset hooks respawn() uses: this re-arms the boss
    // (DORMANT, full HP, fight + music re-triggered on landing) and resets
    // surviving enemies/hazards, then clear any lingering boss projectiles.
    this.entities.forEach(e => { if (e.onPlayerRespawn) e.onPlayerRespawn(); });
    this.entities
      .filter(e => e.tag === 'flame' || e.tag === 'impactWarning')
      .forEach(e => this.entities.remove(e));
    this.cameraFollow.snap();
  }

  _setPlayMenuButtonOpen(open) {
    if (!this.playMenuBtn) return;
    this.playMenuBtn.classList.toggle('open', open);
    this.playMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    this.playMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  togglePlayMenu() {
    if (this._playMenuOpen) {
      this.closePlayMenu();
      return;
    }
    this.openPlayMenu();
  }

  openPlayMenu() {
    if (!this.state.is(STATES.PLAYING) || this._transitioning) return;
    this._playMenuOpen = true;
    this._loggedPlayMenuPause = false;
    this.state.set(STATES.PAUSE);
    this.menuTitle.setStartLabel('RESTART');
    this.menuTitle.show();
    // The pause overlay reuses the title menu; keep Challenge/Ranking off it so
    // they only appear on the actual main menu. During a Challenge run, offer a
    // "Back to Menu" button to abandon the run.
    this.menuTitle.setChallengeUnlocked(false);
    this.menuTitle.setBackToMenuVisible(this.currentGameMode === 'challenge');
    this.mobile.setGameplayEnabled(false);
    this._setPlayMenuButtonOpen(true);
    this._setBossTestButtonVisible(false);
  }

  closePlayMenu() {
    if (!this._playMenuOpen) return;
    this._playMenuOpen = false;
    this.state.set(STATES.PLAYING);
    this.menuTitle.hide();
    this.menuTitle.setStartLabel('START');
    this.menuTitle.setBackToMenuVisible(false);
    this.mobile.setGameplayEnabled(true);
    this._setPlayMenuButtonOpen(false);
    this._setBossTestButtonVisible(!!this.currentLevel?.bossTestSpawn);
  }

  // Triggered when the player enters a level's exit door. Plays a pixel fade,
  // loads the level's nextLevelId off-screen (or returns to menu when null),
  // then fades back in. The world is frozen and input disabled throughout.
  advanceLevel() {
    if (this._transitioning) return;
    if (!this.state.is(STATES.PLAYING)) return;

    // Challenge: a Level 1 run finishes the instant the exit door is reached
    // (it does not continue into Level 2). The All run keeps going (its
    // nextLevelId is level2) and the timer keeps running across the transition.
    if (this.currentGameMode === 'challenge' && this.challengeType === 'level1') {
      this._completeChallenge();
      return;
    }

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

  // Converts a canvas pointer event to world coordinates and, if a reward chest
  // is waiting and the click lands on it, opens it. Works for mouse and touch.
  _handlePointerDown(e) {
    const chest = this.activeChest;
    if (!chest || chest._opened) return;
    if (!this.state.is(STATES.PLAYING) || this._transitioning) return;

    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this._pointer.set(ndcX, ndcY, 0).unproject(this.renderer.camera);
    if (chest.hitTest(this._pointer.x, this._pointer.y)) {
      chest.open(this);
    }
  }

  // Called by the chest once its sword reveal finishes. Pauses the game and
  // shows the Game Complete popup.
  onSwordCollected() {
    if (this.state.is(STATES.PAUSE)) return;

    // Challenge runs (Level 2 / All) finish here instead of the normal Game
    // Complete popup.
    if (this.currentGameMode === 'challenge') {
      this._completeChallenge();
      return;
    }

    // Normal completion: this is the moment Challenge Mode unlocks.
    ChallengeMode.markUnlocked();
    this.state.set(STATES.PAUSE);
    this.bossHud.hide();
    this.mobile.setGameplayEnabled(false);
    this._setPlayMenuButtonVisible(false);
    this._setBossTestButtonVisible(false);
    this.gameComplete.setChallengeAvailable(ChallengeMode.isUnlocked(), ChallengeMode.isNew());
    this.gameComplete.show();
  }

  // Ends the active challenge run: records the time and shows the Challenge
  // Complete popup. Mirrors onSwordCollected's UI teardown (pause + hide HUD).
  _completeChallenge() {
    if (this.state.is(STATES.PAUSE)) return;
    const result = this.challenge.complete();
    this.state.set(STATES.PAUSE);
    this.bossHud.hide();
    this.mobile.setGameplayEnabled(false);
    this._setPlayMenuButtonVisible(false);
    this._setBossTestButtonVisible(false);
    this.challengeTimer.hide();
    this.activeChest = null;
    this.challengeComplete.show(result);
  }

  restartChallenge() {
    this.challengeComplete.hide();
    this.activeChest = null;
    this.startChallenge(this.challengeType);
  }

  _menuFromChallenge() {
    this.challengeComplete.hide();
    this.activeChest = null;
    this._gotoMenu();
  }

  // ---- Challenge selection + ranking popups ----

  // Opens the Challenge selection popup. `from` ('menu' | 'complete') decides
  // where Back returns. Opening it also clears the "NEW" badge.
  openChallengeSelect(from) {
    ChallengeMode.markSeen();
    this.menuTitle.setChallengeUnlocked(ChallengeMode.isUnlocked(), false);
    this.gameComplete.setChallengeAvailable(ChallengeMode.isUnlocked(), false);
    this._challengeBackTo = from;
    if (from === 'complete') {
      this.gameComplete.hide();
    } else {
      this.menuTitle.hide();
    }
    this.challengeSelect.show({ onBack: () => this._closeChallengeSelect() });
  }

  _closeChallengeSelect() {
    this.challengeSelect.hide();
    if (this._challengeBackTo === 'complete') {
      this.gameComplete.show();
    } else {
      this.menuTitle.show();
    }
  }

  // From the in-Challenge pause menu: confirm before abandoning the run.
  _confirmExitChallenge() {
    this.confirmPopup.show({
      message: 'Return to menu? Current challenge run will be lost.',
      onYes: () => this._exitChallengeToMenu(),
      onCancel: () => this.confirmPopup.hide(),
    });
  }

  // Abandons the active challenge run and returns to the main menu. _gotoMenu
  // resets challenge state (currentGameMode/challengeType + challenge.end()),
  // stops and hides the timer, and stops music. No time is saved (only
  // challenge.complete() records a time), so rankings are untouched and the mode
  // stays unlocked.
  _exitChallengeToMenu() {
    this.confirmPopup.hide();
    this._gotoMenu();
  }

  openRanking() {
    this.menuTitle.hide();
    this.rankingPopup.show({});
  }

  _closeRanking() {
    this.rankingPopup.hide();
    this.menuTitle.show();
  }

  _restartFromComplete() {
    this.gameComplete.hide();
    this.activeChest = null;
    this.startCampaign(); // back to Level 1, fresh run
  }

  _menuFromComplete() {
    this.gameComplete.hide();
    this.activeChest = null;
    this._gotoMenu();
  }

  requestStartCampaign() {
    if (this._playMenuOpen) {
      this._playMenuOpen = false;
      // RESTART from the in-play pause menu: in a challenge run, restart that
      // same challenge (resets its timer); otherwise restart the campaign.
      if (this.currentGameMode === 'challenge' && this.challengeType) {
        this.startChallenge(this.challengeType);
      } else {
        this.startCampaign();
      }
      return;
    }

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
    if (this._playMenuOpen) {
      this._setPlayMenuButtonVisible(false);
      this._openTutorial({
        onClose: () => {
          this._markTutorialSeen();
          this._playMenuOpen = true;
          this._loggedPlayMenuPause = false;
          this.state.set(STATES.PAUSE);
          this.menuTitle.setStartLabel('RESTART');
          this.menuTitle.show();
          this.menuTitle.setChallengeUnlocked(false);
          this.menuTitle.setBackToMenuVisible(this.currentGameMode === 'challenge');
          this.hud.setVisible(true);
          this.mobile.setGameplayEnabled(false);
          this._setPlayMenuButtonVisible(true);
          this._setPlayMenuButtonOpen(true);
        },
      });
      return;
    }

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
    this._playMenuOpen = false;
    this._setLevel('zoo');
  }

  _handleRestart() {
    if (!this.state.is(STATES.PLAYING)) return;
    this.respawn();
  }

  // Triggered by R, death plane, or hp depletion. Resettable entities get an
  // onPlayerRespawn() hook for retry state (hazards retract, surviving enemies
  // reset position, defeated enemies stay dead until level reload).
  respawn() {
    if (!this.player) return;
    const p = this.checkpoints.respawnPoint();
    // Lift slightly so the player drops onto the platform instead of spawning
    // embedded in it (an embedded spawn gets ejected sideways by the X-axis
    // collision pass and flung off the ledge).
    this.player.respawn(p.x, p.y + WORLD.RESPAWN_LIFT);
    this.sfx.playSfx('checkpointRespawn');
    this.player.godMode = !!this.debugFlags.godMode;
    this.entities.forEach(e => { if (e.onPlayerRespawn) e.onPlayerRespawn(); });
    // Clear any boss projectiles / dive markers immediately so none linger into
    // the retry (the boss itself resets via its onPlayerRespawn above).
    this.entities
      .filter(e => e.tag === 'flame' || e.tag === 'impactWarning')
      .forEach(e => this.entities.remove(e));
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
      if (this._playMenuOpen) this.hud.update(dt, this);
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

    // Challenge run timer. Only advances here (live gameplay, after the
    // pause/transition/freeze early-returns above), so it pauses on menus and
    // transitions but keeps running across death/respawn.
    if (this.currentGameMode === 'challenge' && this.challenge.active) {
      this.challenge.tick(dt);
      this.challengeTimer.setTime(this.challenge.elapsedMs);
    }

    this.entities.update(dt, this);
    this._resolveCombat();

    // HP depleted -> respawn.
    if (this.player && this.player.hp <= 0) {
      this.respawn();
      this.input.endFrame();
      return;
    }
    // Fell: send the player back to their last activated checkpoint. The level
    // has a full-width ground floor, so a fall would otherwise strand them at
    // the bottom. Trigger once they drop well below their current respawn point
    // (or past the hard death plane as a backstop).
    if (this.player) {
      const rp = this.checkpoints.respawnPoint();
      if (this.player.aabb.y < rp.y - WORLD.FALL_RESPAWN_DROP ||
          this.player.aabb.y < WORLD.DEATH_Y) {
        this.respawn();
      }
    }

    this.cameraFollow.update(dt);
    this.hud.update(dt, this);
    this.input.endFrame();
  }

  render() {
    this.renderer.render();
  }
}
