// Handmade swept-AABB resolution against static solids (platforms, walls).
// Dynamic actors call physics.moveAndCollide(actor, dt) themselves so each
// actor's controller can react to the contact flags it gets back.
//
// Resolution order: X axis, then Y axis. This prevents corner-snag bugs where
// a single combined sweep can wedge an actor into a seam between two solids.

import { PLAYER } from '../config/constants.js';

const SKIN = PLAYER.SKIN;

export class Physics {
  constructor(entities) {
    this.entities = entities;
  }

  update(_dt) {
    // Intentionally empty. Actors drive their own collision queries.
  }

  // Returns all solid entities for the current frame.
  solids() {
    return this.entities.filter(e => e.solid);
  }

  // Move `actor` by its velocity*dt with X-then-Y resolution.
  // actor needs:  aabb { x, y, w, h }, vel { x, y }
  // Returns flags: { groundedHit, ceilingHit, wallLeftHit, wallRightHit, contacts[] }
  moveAndCollide(actor, dt) {
    const solids = this.solids();
    const flags = {
      groundedHit: false,
      ceilingHit: false,
      wallLeftHit: false,
      wallRightHit: false,
      contacts: [],
    };

    // X pass
    actor.aabb.x += actor.vel.x * dt;
    for (const s of solids) {
      if (s === actor) continue;
      // One-way decks never block horizontally — you pass through their sides.
      if (s.oneWay) continue;
      if (!this._overlap(actor.aabb, s.aabb)) continue;
      if (actor.vel.x > 0) {
        actor.aabb.x = s.aabb.x - s.aabb.w / 2 - actor.aabb.w / 2 - SKIN;
        flags.wallRightHit = true;
      } else if (actor.vel.x < 0) {
        actor.aabb.x = s.aabb.x + s.aabb.w / 2 + actor.aabb.w / 2 + SKIN;
        flags.wallLeftHit = true;
      } else {
        // Already overlapping at rest — push to nearest side.
        if (actor.aabb.x < s.aabb.x) {
          actor.aabb.x = s.aabb.x - s.aabb.w / 2 - actor.aabb.w / 2 - SKIN;
          flags.wallRightHit = true;
        } else {
          actor.aabb.x = s.aabb.x + s.aabb.w / 2 + actor.aabb.w / 2 + SKIN;
          flags.wallLeftHit = true;
        }
      }
      actor.vel.x = 0;
      flags.contacts.push({ entity: s, axis: 'x' });
    }

    // Y pass
    const prevBottom = actor.aabb.y - actor.aabb.h / 2;
    actor.aabb.y += actor.vel.y * dt;
    for (const s of solids) {
      if (s === actor) continue;
      if (!this._overlap(actor.aabb, s.aabb)) continue;
      // One-way decks only catch an actor that is descending AND was above the
      // deck last frame. Moving up (or coming from below) passes straight
      // through; this also means no underside/side block and no getting stuck.
      if (s.oneWay) {
        const top = s.aabb.y + s.aabb.h / 2;
        if (!(actor.vel.y <= 0 && prevBottom >= top - SKIN)) continue;
      }
      if (actor.vel.y > 0) {
        actor.aabb.y = s.aabb.y - s.aabb.h / 2 - actor.aabb.h / 2 - SKIN;
        flags.ceilingHit = true;
      } else if (actor.vel.y < 0) {
        actor.aabb.y = s.aabb.y + s.aabb.h / 2 + actor.aabb.h / 2 + SKIN;
        flags.groundedHit = true;
      } else {
        if (actor.aabb.y < s.aabb.y) {
          actor.aabb.y = s.aabb.y - s.aabb.h / 2 - actor.aabb.h / 2 - SKIN;
          flags.ceilingHit = true;
        } else {
          actor.aabb.y = s.aabb.y + s.aabb.h / 2 + actor.aabb.h / 2 + SKIN;
          flags.groundedHit = true;
        }
      }
      actor.vel.y = 0;
      flags.contacts.push({ entity: s, axis: 'y' });
    }

    return flags;
  }

  // Returns the first solid that overlaps the given AABB, or null.
  overlapAny(aabb, exclude = null, predicate = null) {
    for (const s of this.solids()) {
      if (s === exclude) continue;
      if (predicate && !predicate(s)) continue;
      if (this._overlap(aabb, s.aabb)) return s;
    }
    return null;
  }

  _overlap(a, b) {
    return Physics.overlap(a, b);
  }

  // Shared AABB overlap helper. Useful from any system without a Physics
  // instance handy (e.g. Arrow vs. player).
  static overlap(a, b) {
    return (
      Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
      Math.abs(a.y - b.y) < (a.h + b.h) / 2
    );
  }
}
