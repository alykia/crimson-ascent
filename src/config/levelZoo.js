// Crimson Ascent - Zoo/Sandbox developer room.
//
// Purpose: fast smoke-testing for enemy behaviors and core mechanics.
// Spawn starts on a high hub platform; each bay below isolates one concept.
//
// Object types:
//   platform | wall | walker | archer | flyer | arrowPickup | spike | checkpoint | label | door | boss

export const ZOO_LEVEL = {
  id: 'zoo',
  name: 'zoo',
  title: 'Developer Zoo',
  spawn: { x: 0, y: 31.2 },
  nextLevelId: 'level2',
  debugAnchors: [
    { id: 'hub', label: 'Hub', x: 0, y: 31.2 },
    { id: 'walker', label: 'Walker Bay', x: -19, y: 3.2 },
    { id: 'archer', label: 'Archer Bay', x: -9.5, y: 3.2 },
    { id: 'flyer', label: 'Flyer Bay', x: 0, y: 3.2 },
    { id: 'spike', label: 'Spike Bay', x: 9.5, y: 3.2 },
    { id: 'traversal', label: 'Traversal Bay', x: 19, y: 3.2 },
    { id: 'ammo', label: 'Ammo Station', x: 0, y: 25.2 },
    { id: 'boss', label: 'Boss Arena', x: -6, y: 38.2 },
  ],
  objects: [
    // ---- Global bounds ----
    { type: 'platform', x: 0, y: -1, w: 50, h: 1 },
    { type: 'wall', x: -25, y: 16, w: 1, h: 34 },
    { type: 'wall', x: 25, y: 16, w: 1, h: 34 },

    // ---- Top hub and drop points ----
    { type: 'platform', x: -13, y: 30, w: 10, h: 0.6, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x: 0, y: 30, w: 10, h: 0.6, spriteVariant: 'platform3' },
    { type: 'platform', x: 13, y: 30, w: 10, h: 0.6, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'checkpoint', x: 0, y: 31.0 },
    { type: 'label', x: 0, y: 32.7, text: 'ZOO HUB: jump into bays, F1 for tools', w: 9.4, h: 0.95 },
    { type: 'door', x: 13, y: 31.4, w: 1.6, h: 2.6, activateAtY: 29.5 },
    { type: 'label', x: 13, y: 33.4, text: 'DOOR TEST: ENTER FOR LEVEL 2', w: 6.8, h: 0.86 },

    // ---- Boss arena smoke test ----
    // Reach it from the hub stairs or use the Boss Arena debug anchor.
    // The platform is intentionally narrower than the zoo bounds, so you can
    // test falling out of the arena and boss reset behavior.
    { type: 'platform', x: -5, y: 32.8, w: 3.2, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -2, y: 35.2, w: 3.2, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: 0, y: 37.2, w: 16, h: 1.2, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: -6, y: 38.2 },
    { type: 'label', x: 0, y: 40.4, text: 'BOSS TEST: ARROWS + DASH, CLICK CHEST AFTER DEFEAT', w: 11.4, h: 0.86 },
    {
      type: 'boss',
      x: 0,
      y: 38.9,
      activateAtY: 37.8,
      arena: { minX: -8, maxX: 8, groundY: 37.8 },
    },

    // ---- Ammo station near spawn hub ----
    { type: 'platform', x: 0, y: 24.6, w: 6, h: 0.6, spriteVariant: 'platform3' },
    { type: 'arrowPickup', x: -1.2, y: 25.3, amount: 5 },
    { type: 'arrowPickup', x: 1.2, y: 25.3, amount: 5 },
    { type: 'label', x: 0, y: 26.1, text: 'AMMO STATION', w: 4.1, h: 0.8 },

    // ---- Left-side return stairs ----
    { type: 'platform', x: -23, y: 3, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -21, y: 6, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: -19, y: 9, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -17, y: 12, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: -15, y: 15, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -13, y: 18, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: -11, y: 21, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -9, y: 24, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: -7, y: 27, w: 2.6, h: 0.45, spriteVariant: 'platform2' },

    // ---- Right-side return stairs ----
    { type: 'platform', x: 23, y: 3, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: 21, y: 6, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: 19, y: 9, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: 17, y: 12, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: 15, y: 15, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: 13, y: 18, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: 11, y: 21, w: 2.6, h: 0.45, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: 9, y: 24, w: 2.6, h: 0.45, spriteVariant: 'platform3' },
    { type: 'platform', x: 7, y: 27, w: 2.6, h: 0.45, spriteVariant: 'platform2' },

    // ---- Bay separators ----
    { type: 'wall', x: -14, y: 8.5, w: 0.5, h: 17 },
    { type: 'wall', x: -4, y: 8.5, w: 0.5, h: 17 },
    { type: 'wall', x: 4, y: 8.5, w: 0.5, h: 17 },
    { type: 'wall', x: 14, y: 8.5, w: 0.5, h: 17 },

    // ---- Walker bay ----
    { type: 'platform', x: -19, y: 2.0, w: 7.2, h: 0.6, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x: -21, y: 5.1, w: 3.1, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: -17, y: 6.8, w: 3.1, h: 0.5, spriteVariant: 'platform2' },
    { type: 'walker', x: -19, y: 3.0, dir: 1 },
    { type: 'label', x: -19, y: 9.2, text: 'WALKER: dash-kill reset test', w: 6.9, h: 0.86 },

    // ---- Archer bay ----
    { type: 'platform', x: -9.5, y: 2.0, w: 6.6, h: 0.6, spriteVariant: 'platform3' },
    { type: 'platform', x: -7.4, y: 5.4, w: 3.0, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -11.4, y: 5.1, w: 2.8, h: 0.5, spriteVariant: 'platform3' },
    { type: 'archer', x: -7.4, y: 6.4, dir: -1 },
    { type: 'label', x: -9.5, y: 9.2, text: 'ARCHER: projectile pressure', w: 6.2, h: 0.86 },

    // ---- Flyer bay ----
    { type: 'platform', x: 0, y: 2.0, w: 6.6, h: 0.6, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x: -1.9, y: 5.1, w: 2.8, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: 2.0, y: 6.6, w: 2.8, h: 0.5, spriteVariant: 'platform3' },
    { type: 'flyer', x: 0, y: 4.3, range: 2.0 },
    { type: 'label', x: 0, y: 9.2, text: 'FLYER: aerial patrol + spacing', w: 6.4, h: 0.86 },

    // ---- Spike bay ----
    { type: 'platform', x: 9.5, y: 2.0, w: 6.6, h: 0.6, spriteVariant: 'platform3' },
    { type: 'platform', x: 8.0, y: 5.0, w: 2.8, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: 11.2, y: 6.7, w: 2.8, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike', x: 9.5, y: 8.0, w: 1, h: 1, triggerH: 6.3 },
    { type: 'label', x: 9.5, y: 9.2, text: 'SPIKE: trigger, warning, reset', w: 6.4, h: 0.86 },

    // ---- Traversal bay ----
    { type: 'platform', x: 19, y: 2.0, w: 7.2, h: 0.6, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'wall', x: 16.8, y: 6.0, w: 0.55, h: 6.3 },
    { type: 'wall', x: 21.2, y: 6.0, w: 0.55, h: 6.3 },
    { type: 'platform', x: 19, y: 9.3, w: 4.0, h: 0.5, spriteVariant: 'platform3' },
    { type: 'walker', x: 19, y: 3.0, dir: -1 },
    { type: 'label', x: 19, y: 11.0, text: 'TRAVERSAL: wall jump + dash chain', w: 7.7, h: 0.86 },
  ],
};
