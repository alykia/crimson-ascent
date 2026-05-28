// Owns the list of live entities and their meshes. Entities follow a simple
// duck-typed interface:
//   - mesh?   THREE.Object3D added to scene on add()
//   - update?(dt, game)
//   - tag?    string used by other systems to filter
//   - solid?  boolean — included in physics broadphase
//   - onAdded?(em), onRemoved?(em)

export class EntityManager {
  constructor(scene) {
    this.scene = scene;
    this.entities = [];
    this._toRemove = [];
  }

  add(entity) {
    this.entities.push(entity);
    if (entity.mesh) this.scene.add(entity.mesh);
    if (entity.onAdded) entity.onAdded(this);
    return entity;
  }

  // Defer removal until end-of-frame so iteration is safe.
  remove(entity) {
    if (!entity || entity._pendingRemove) return;
    entity._pendingRemove = true;
    this._toRemove.push(entity);
  }

  clear() {
    for (const e of this.entities) {
      if (e.mesh) this.scene.remove(e.mesh);
      if (e.onRemoved) e.onRemoved(this);
    }
    this.entities.length = 0;
    this._toRemove.length = 0;
  }

  update(dt, game) {
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (e._pendingRemove) continue;
      if (e.update) e.update(dt, game);
    }
    this._flush();
  }

  _flush() {
    if (this._toRemove.length === 0) return;
    for (const e of this._toRemove) {
      const i = this.entities.indexOf(e);
      if (i >= 0) this.entities.splice(i, 1);
      if (e.mesh) this.scene.remove(e.mesh);
      if (e.onRemoved) e.onRemoved(this);
    }
    this._toRemove.length = 0;
  }

  forEach(cb) {
    for (const e of this.entities) if (!e._pendingRemove) cb(e);
  }

  filter(pred) {
    const out = [];
    for (const e of this.entities) {
      if (!e._pendingRemove && pred(e)) out.push(e);
    }
    return out;
  }

  byTag(tag) {
    return this.filter(e => e.tag === tag);
  }

  first(pred) {
    for (const e of this.entities) {
      if (!e._pendingRemove && pred(e)) return e;
    }
    return null;
  }
}
