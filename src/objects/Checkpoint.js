import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { Physics } from '../systems/Physics.js';
import checkpointSpriteUrl from '../assets/T_Checkpoint_Sprite.png';

let checkpointTexture = null;

function getCheckpointTexture() {
  if (checkpointTexture) return checkpointTexture;
  checkpointTexture = new THREE.TextureLoader().load(checkpointSpriteUrl);
  checkpointTexture.magFilter = THREE.NearestFilter;
  checkpointTexture.minFilter = THREE.NearestFilter;
  checkpointTexture.colorSpace = THREE.SRGBColorSpace;
  return checkpointTexture;
}

const CHECKPOINT_VISUAL_SIZE = 2.6;
const GLOW_SCALE_MULT = 1.18;
const ACTIVE_GLOW_OPACITY = 0.52;
const PARTICLE_COUNT = 84;
const BURST_PARTICLE_COUNT = 44;
const BURST_DURATION = 0.42;

// Glowing blue box. Player touch activates it (sticky — survives respawn).
// Activation deactivates the previously active checkpoint via CheckpointSystem.
// Per dev plan: only restores position + HP; we also reset enemies / hazards
// via the existing onPlayerRespawn pass in Game.respawn.
export class Checkpoint {
  constructor(opts) {
    this.tag = 'checkpoint';
    this.solid = false;
    this.aabb = { x: opts.x, y: opts.y, w: 0.8, h: 1.4 };
    this.active = false;

    this._baseMat = new THREE.SpriteMaterial({
      map: getCheckpointTexture(),
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      color: 0xffffff,
    });
    this._baseSprite = new THREE.Sprite(this._baseMat);
    this._baseSprite.scale.set(CHECKPOINT_VISUAL_SIZE, CHECKPOINT_VISUAL_SIZE, 1);
    this._baseSprite.position.set(0, 0, 0.35);

    this._glowMat = new THREE.SpriteMaterial({
      map: getCheckpointTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: COLORS.CHECKPOINT_ACTIVE,
      opacity: 0.0,
    });
    this._glowSprite = new THREE.Sprite(this._glowMat);
    const glowSize = CHECKPOINT_VISUAL_SIZE * GLOW_SCALE_MULT;
    this._glowSprite.scale.set(glowSize, glowSize, 1);
    this._glowSprite.position.set(0, 0, 0.34);

    this._particlePhase = new Float32Array(PARTICLE_COUNT);
    this._particleBase = new Float32Array(PARTICLE_COUNT * 3);
    this._particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    this._particleColors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() * 2 - 1) * (CHECKPOINT_VISUAL_SIZE * 0.28);
      const y = CHECKPOINT_VISUAL_SIZE * (-0.06 + Math.random() * 0.62);
      this._particleBase[i3] = x;
      this._particleBase[i3 + 1] = y;
      this._particleBase[i3 + 2] = 0;
      this._particlePositions[i3] = x;
      this._particlePositions[i3 + 1] = y;
      this._particlePositions[i3 + 2] = 0;
      this._particlePhase[i] = Math.random() * Math.PI * 2;
      const bright = i % 3 === 0;
      // Mix cool cyan + white sparkles for a more magical look.
      this._particleColors[i3] = bright ? 0.80 : 0.42;
      this._particleColors[i3 + 1] = bright ? 0.96 : 0.78;
      this._particleColors[i3 + 2] = 1.0;
    }
    this._particleGeo = new THREE.BufferGeometry();
    this._particleGeo.setAttribute('position', new THREE.BufferAttribute(this._particlePositions, 3));
    this._particleGeo.setAttribute('color', new THREE.BufferAttribute(this._particleColors, 3));
    this._particleMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.078,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.0,
    });
    this._particles = new THREE.Points(this._particleGeo, this._particleMat);
    this._particles.position.set(0, 0.08, 0.45);
    this._particles.visible = false;

    this._burstPositions = new Float32Array(BURST_PARTICLE_COUNT * 3);
    this._burstVelocities = new Float32Array(BURST_PARTICLE_COUNT * 3);
    this._burstGeo = new THREE.BufferGeometry();
    this._burstGeo.setAttribute('position', new THREE.BufferAttribute(this._burstPositions, 3));
    this._burstMat = new THREE.PointsMaterial({
      color: 0xbff6ff,
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.0,
    });
    this._burstParticles = new THREE.Points(this._burstGeo, this._burstMat);
    this._burstParticles.position.set(0, 0.1, 0.5);
    this._burstParticles.visible = false;
    this._burstTimer = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.set(opts.x, opts.y, 0);
    this.mesh.add(this._glowSprite);
    this.mesh.add(this._baseSprite);
    this.mesh.add(this._particles);
    this.mesh.add(this._burstParticles);
    this._t = 0;
  }

  setActive(v) {
    this.active = v;
    this._particles.visible = v;
    this._glowMat.opacity = v ? ACTIVE_GLOW_OPACITY : 0;
    this._particleMat.opacity = v ? 0.92 : 0;
    if (v) this._triggerBurst();
    if (!v) {
      this._baseSprite.scale.set(CHECKPOINT_VISUAL_SIZE, CHECKPOINT_VISUAL_SIZE, 1);
      const glowSize = CHECKPOINT_VISUAL_SIZE * GLOW_SCALE_MULT;
      this._glowSprite.scale.set(glowSize, glowSize, 1);
      this._burstTimer = 0;
      this._burstMat.opacity = 0;
      this._burstParticles.visible = false;
    }
  }

  update(dt, game) {
    this._t += dt;
    if (this.active) {
      const shimmer = 0.46 + Math.sin(this._t * 3.2) * 0.1;
      this._glowMat.opacity = ACTIVE_GLOW_OPACITY + shimmer;
      this._particleMat.opacity = 0.88 + Math.sin(this._t * 4.6) * 0.1;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const phase = this._particlePhase[i];
        const baseX = this._particleBase[i3];
        const baseY = this._particleBase[i3 + 1];
        const orbitX = Math.sin(this._t * 2.6 + phase) * 0.052;
        const orbitY = Math.cos(this._t * 3.4 + phase) * 0.046;
        const drift = Math.sin(this._t * 1.35 + phase * 0.7) * 0.04;
        this._particlePositions[i3] = baseX + orbitX + drift;
        this._particlePositions[i3 + 1] = baseY + orbitY + Math.abs(Math.sin(this._t * 1.8 + phase)) * 0.06;
        this._particlePositions[i3 + 2] = 0;
      }
      this._particleGeo.attributes.position.needsUpdate = true;
    }
    if (this._burstTimer > 0) {
      this._burstTimer = Math.max(0, this._burstTimer - dt);
      const life = this._burstTimer / BURST_DURATION;
      this._burstMat.opacity = life * 0.95;
      for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        this._burstPositions[i3] += this._burstVelocities[i3] * dt;
        this._burstPositions[i3 + 1] += this._burstVelocities[i3 + 1] * dt;
        this._burstVelocities[i3 + 1] -= 0.55 * dt;
      }
      this._burstGeo.attributes.position.needsUpdate = true;
      this._burstParticles.visible = true;
      if (this._burstTimer <= 0) {
        this._burstMat.opacity = 0;
        this._burstParticles.visible = false;
      }
    }
    if (game.player && !this.active && Physics.overlap(this.aabb, game.player.aabb)) {
      game.checkpoints.activate(this);
    }
  }

  _triggerBurst() {
    this._burstTimer = BURST_DURATION;
    for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const radius = Math.random() * (CHECKPOINT_VISUAL_SIZE * 0.16);
      const speed = 0.38 + Math.random() * 0.7;
      this._burstPositions[i3] = Math.cos(theta) * radius;
      this._burstPositions[i3 + 1] = (Math.random() * 2 - 1) * 0.15;
      this._burstPositions[i3 + 2] = 0;
      this._burstVelocities[i3] = Math.cos(theta) * speed;
      this._burstVelocities[i3 + 1] = Math.sin(theta) * speed + 0.55;
      this._burstVelocities[i3 + 2] = 0;
    }
    this._burstMat.opacity = 0.95;
    this._burstParticles.visible = true;
    this._burstGeo.attributes.position.needsUpdate = true;
  }

  onPlayerRespawn() {
    // Sticky: do nothing. Active flag persists across deaths.
    this._t = 0;
  }

  onRemoved() {
    this._baseMat?.dispose();
    this._glowMat?.dispose();
    this._particleGeo?.dispose();
    this._particleMat?.dispose();
    this._burstGeo?.dispose();
    this._burstMat?.dispose();
  }
}
