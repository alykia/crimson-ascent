Vampire Platformer Prototype — Graybox Development Roadmap - Name of the game is "Crimson Ascent"
Project Overview
Project Type

2D vertical precision platformer built in ThreeJS.

Prototype Goal

Create a graybox vertical slice focused entirely on:

movement feel
responsiveness
platforming readability
traversal-combat interaction
mobile/browser playability

The prototype is not intended to showcase final visuals or content quantity.

The objective is to validate whether the core mechanics feel satisfying and coherent together before entering production/art phases.

Core Gameplay Identity
Gameplay Style
methodical
precise
vertical
controlled pacing
traversal-focused

The gameplay should reward:

positioning
patience
route planning
clean execution

The game should avoid:

chaotic combat
overly fast action
complex combo systems
Core Mechanics Summary
Movement
horizontal movement
jump
wall jump
wall stamina limitation
coyote time
jump buffering
Combat
horizontal dash attack
dash resets on enemy hit
arrows weaken enemies
weakened enemies become vulnerable to dash execution
Hazards
falling spikes
knockback damage
Systems
health system
checkpoints
limited arrow ammo
continuous vertical level
Technical Foundation
Engine

ThreeJS

Camera

Orthographic camera.

Gameplay constrained to:

X axis
Y axis

Minimal Z usage only for:

layer separation
background depth later
Collision Philosophy

Use:

box collisions only
handmade platformer physics
deterministic movement

Do NOT use:

realistic physics simulation
slopes
ragdolls
complex mesh collisions
Graybox Visual Rules

The prototype should use only:

cubes
rectangles
flat colors
placeholder geometry

Suggested readability colors:

Platforms

Dark gray

Hazards

Red

Enemies

White or pale red

Checkpoints

Blue

Arrow pickups

Yellow

Development Philosophy

The prototype should prioritize:

feel
responsiveness
clarity
fast iteration

NOT:

art polish
narrative
worldbuilding
optimization

Every system should remain small and testable.

Phase 1 — Project Setup
Goal

Create a stable playable environment.

Tasks
Setup ThreeJS project structure

Create:

renderer
scene
orthographic camera
game loop
resize handling
Create base game architecture

Setup:

update loop
entity manager
collision manager
input system
checkpoint system
state manager
Setup level bounds

Create:

floor
walls
basic test platforms
Setup placeholder visuals

Simple:

cubes
rectangles
flat materials

No textures.

Phase 2 — Core Player Controller
Goal

Make movement feel good before adding gameplay systems.

This is the MOST important phase.

Tasks
Horizontal Movement

Implement:

acceleration
deceleration
air control

Focus on:

responsiveness
precision

Avoid floaty movement.

Jump

Implement:

standard jump
gravity
jump apex tuning

Optional later:

variable jump height
Coyote Time

Allow jump shortly after leaving a platform.

Purpose:

improve fairness
reduce frustration
Jump Buffering

Store jump input briefly before landing.

Purpose:

smoother controls
precision platforming quality
Wall Detection

Implement:

left wall detection
right wall detection
Wall Jump

Implement:

directional push-off
vertical boost

Focus on:

readability
consistency
Wall Stamina System

Rules:

3 wall interactions maximum
resets only when grounded
no visible UI for prototype

Behavior:

player loses wall grip after limit reached
Death Plane

If player falls below map:

instant respawn at checkpoint

Purpose:

fast retry loop
Phase 3 — Dash Attack System
Goal

Implement the prototype’s signature mechanic.

Tasks
Dash Input

Implement:

horizontal dash only
usable on ground and air
Dash Behavior

Dash should:

move very quickly
feel precise
stop on wall collision
stop on enemy hit

The dash should NOT:

pass through walls
continue infinitely
Dash Cooldown Rules

Player:

has one dash available
regains dash after enemy hit
regains dash after touching ground
Dash Collision

Implement:

enemy collision
wall collision
platform collision
Dash Freeze Frame

On successful enemy hit:

tiny freeze frame
small hit pause

Purpose:

impact feedback
satisfying combat feel
Dash Effects

Graybox version:

simple trail
color flash

No final VFX yet.

Phase 4 — Health and Damage
Goal

Add failure states and danger.

Tasks
Player Health

Suggested:

3 health points
Damage System

Implement:

damage intake
invulnerability frames
knockback
Enemy Damage

Enemies:

damage player heavily
create positional danger
Hazard Damage

Spikes:

deal major damage
apply knockback
Death Handling

On death:

respawn at checkpoint
restore health
reset hazards
Phase 5 — Enemy Systems
Goal

Create gameplay interaction targets.

Enemy complexity should remain LOW.

Enemy Type 1 — Walker
Behavior
walks left/right
turns at edges
Interaction
dies instantly to dash
can be weakened by arrows

Purpose:

basic dash chaining target
Enemy Type 2 — Archer
Behavior
stationary or limited movement
shoots slow projectile

Purpose:

timing pressure
Enemy Type 3 — Flying Enemy
Behavior
simple patrol movement
aerial positioning

Purpose:

airborne dash chaining
Enemy Persistence

Enemies remain dead until:

room reset
player death

Enemies should NOT instantly respawn.

Phase 6 — Arrow System
Goal

Add tactical ranged support tool.

Tasks
Arrow Shooting

Implement:

directional shooting
ammo consumption
Arrow Ammo

Ammo is:

limited
replenished through pickups
Enemy Weakening

Arrow hits:

weaken enemies
visually indicate vulnerability

Suggested:

color flash
state change
Dash Execution

Weakened enemies:

become vulnerable to instant dash execution

Purpose:

create combat setup loop
Phase 7 — Environmental Hazards
Goal

Add platforming pressure.

Falling Spikes
Behavior
triggered by player entering area
short warning delay
spikes fall downward
spikes reset after several seconds
Purpose
timing pressure
punish hesitation
increase tension
Phase 8 — Checkpoint System
Goal

Support precision platforming retry loop.

Checkpoint Rules

When activated:

save player position only

On death:

restore player health
respawn at checkpoint
Checkpoint Design

Suggested visual:

glowing blue rectangle/cube
Phase 9 — Camera System
Goal

Support vertical readability.

Camera Behavior

Smooth follow:

no harsh snapping
slightly delayed follow
prioritize visibility above player
Camera Priorities
readable jumps
readable hazards
stable framing

Avoid:

excessive smoothing
camera lag
Phase 10 — Mobile Controls
Goal

Ensure browser/mobile compatibility.

Mobile Layout
Left Side

Virtual joystick

Right Side

Buttons:

jump
dash
arrow
Input Priorities

Controls must:

remain readable
avoid overlap
feel responsive
Phase 11 — Prototype Level Design
Goal

Create one continuous vertical challenge level.

The level should remain SMALL.

Recommended Structure
Section 1 — Basic Movement

Introduce:

movement
jumping
platform spacing
Section 2 — Wall Jumping

Introduce:

wall climbing
stamina limitation
Section 3 — Dash Introduction

Introduce:

dash movement
enemy dash reset
Section 4 — Arrow Usage

Introduce:

ranged weakening
ammo pickups
Section 5 — Falling Spikes

Introduce:

environmental hazards
timing challenges
Section 6 — Combined Challenge

Combine:

jumps
wall jumps
dash chaining
weakened enemies
falling spikes
checkpoints
Prototype Success Criteria

The prototype succeeds if:

movement feels satisfying
wall jumps feel consistent
dash chaining feels rewarding
checkpoints create good retry pacing
mobile controls remain playable
the level feels readable
the mechanics support each other naturally

The prototype does NOT need:

final art
story
advanced UI
polished animation
large content quantity
Features Explicitly Excluded

Do NOT implement during graybox phase:

bosses
inventory
RPG systems
skill trees
collectibles
dialogue
advanced AI
metroidvania map
multiple weapons
final visual polish
advanced shaders
complex particle systems

The prototype should stay highly focused on gameplay feel and mechanic validation.

---

Playtest Log

Gate A — 2026-05-28

Reported

- Basic jump is not high enough to reach the first platform.
- Rest of the locomotion feel (run, stop, wall slide) feels right so far.
- Gates B and C unable to evaluate yet because Section 1 was unreachable.

Diagnosis

- With JUMP_VELOCITY=19, max single-jump rise = v² / (2 * gravity) = 361 / 150 ≈ 2.41 world units. The first platform top was at y=2.75 above the grounded player center, an absolute shortfall of ~0.34 units. Subsequent platforms were also too far apart vertically (2.5 units), so even if the first one had been cleared the second jump would have been impossible too. The level as authored was unplayable, not a feel problem.

Changes

- JUMP_VELOCITY: 19 → 22 (modest "slightly higher" per request; ~16% velocity bump, ~34% taller peak).
- Re-laid out the entire level with consistent 2.0-unit vertical spacing and ~4-unit horizontal gaps so all jumps land with reasonable margin.
- Section 2 chimney shortened to 4 units so 3 wall jumps clear it with margin.
- Sections 3-6 vertical anchors shifted down to fit within the new reachability budget.

Next at Gate A

- Re-test: first platform should be a comfortable jump, subsequent platforms feel consistent. If jumps now feel floaty, drop JUMP_VELOCITY by 1.
- If Section 1 is clean, proceed to wall chimney (Section 2). If you can't make the chimney in three wall jumps, that's a WALL_JUMP_VY tuning question, not level layout.

Gate A — 2026-05-28 (iteration 2)

Reported

- Dash was "a bit too strong, it goes too far to the sides".

Diagnosis

- Dash itself was 160 ms × 22 u/s = 3.5 units. The real culprit was the dash's exit velocity: when the dash ended, vel.x was still 22 and the air decel is only 22 u/s, so the player coasted ~10+ more units before stopping. Total uncontrolled carry could approach 14 units.

Changes

- DASH_DURATION_MS: 160 → 120 (crisper dash, ~2.6 units of pure-dash distance instead of 3.5).
- New exit-velocity clamp in Player.js: when leaving the dash state via any path (duration expired, wall-cancel, or enemy-hit cancel), horizontal velocity is clamped to MAX_RUN_SPEED. The dash now reads as a decisive commitment, not a glide.
- Total horizontal carry after dash now ~4 units (2.6 dash + ~1.7 decel tail), down from ~14.

Also clarified

- The blue rectangles in the level are checkpoints. Each section ends with one. Walk through it and it brightens + pulses (that becomes your respawn point). On death (HP=0 or fall off world) you respawn at the last activated checkpoint with full HP and the section's enemies/hazards reset.

Gate A — 2026-05-28 (iteration 3)

Reported

- Want to be able to jump again in the air right after an air dash.
- Drop dash duration further to 100.

Changes

- DASH_DURATION_MS: 120 → 100. Dash distance during the dash window is now ~2.2 units; total horizontal carry with the exit cap is ~3.9 units.
- New mechanic: an "air-dash jump refund". If the dash starts while airborne, exiting the dash arms a single bonus mid-air jump. The bonus jump uses the same JUMP_VELOCITY as a normal jump (so the dash-jump-dash-jump combo is a real traversal tool but not infinite). The refund is consumed on use, and is cleared on ground touch — so each air sequence can give you at most one bonus jump.
- Debug overlay shows "air jump: ready (from dash)" while the refund is armed.

Why this design

- The intent is to make precise air traversal possible without devaluing wall jumping or making the player feel floaty. A ground dash that flies off a ledge does not grant an air-jump (since the dash didn't start airborne) — coyote time still handles that case.
- Combined with the dash-resets-on-enemy-hit rule, a clean dash-kill in the air now also gives you both a fresh dash AND a fresh air-jump, opening up real combat chains for Phase 5 enemies.

Gate A — 2026-05-28 (iteration 4)

Reported

- Path feels blocked after the first checkpoint.
- First checkpoint feels too early.

Changes

- Removed the Section 1 checkpoint at y=9.2 so the first checkpoint now comes after the wall-jump intro (Section 2 checkpoint at y=15.7). This improves early pacing and asks for one full movement+wall-jump sequence before the first save.
- Raised Section 2 chimney walls by +1.0y (center 12.5 -> 13.5, same height) so the entry from the y=10 shelf is clearly open and no longer reads like a sealed route.

Expected result

- You should be able to progress cleanly past the former choke point into the chimney, then claim the first checkpoint after completing that section.

Gate A — 2026-05-28 (iteration 5)

Reported

- Jump after dash still needs to feel more responsive.
- A platform below the first checkpoint still reads as a blocker.
- Requested a few side platforms to ease route-finding without making the climb free.

Changes

- Dash -> jump responsiveness improved in Player.js:
  - If an airborne dash ends by timer, the air-jump refund is armed immediately in the same update pass (before jump consumption).
  - Added a same-frame fallback that consumes a buffered jump right after dash exit (covers timer end, wall-cancel, and enemy-hit cancel paths).
  - Result: pressing jump at dash end should trigger on that frame instead of feeling one frame late.
- Section 2 top shelf under the first checkpoint changed from one wide platform to two narrow side ledges:
  - Removed: platform x=3, y=14.5, w=4.
  - Added: platform x=1.8, y=14.5, w=1.5 and platform x=4.2, y=14.5, w=1.5.
  - This keeps traversal intent but opens the center line so it no longer feels blocked.
- Added two optional side-assist platforms in Section 3:
  - x=-7.2, y=18.0, w=2.0
  - x=6.8, y=20.0, w=2.0
  These are bailout options for recovery and route choice, but small enough not to flatten the challenge curve.

Gate B — 2026-05-28 (iteration 1)

Reported

- Arrows do not hurt enemies enough.
- Requested: 5 arrows should kill a basic enemy.
- Requested: arrow limit 10.
- Requested: 5 lives instead of 3.
- First checkpoint currently not reachable.

Changes

- Added arrow HP to enemies (Enemy.takeArrowHit):
  - New ENEMY.BASIC_ARROW_HP = 5.
  - Player arrows now subtract 1 HP per hit and kill at 0.
  - For enemies that require weakening, first arrow still applies weakened state so dash-kill flow remains valid.
- Player ammo tuning:
  - ARROW_AMMO_MAX: 5 -> 10
  - ARROW_AMMO_START: 3 -> 10
- Player survivability:
  - MAX_HP: 3 -> 5
- Checkpoint reachability:
  - Lowered first checkpoint from y=15.7 -> y=15.1 so it can be reliably touched while exiting the chimney route.

Gate B — 2026-05-28 (iteration 2)

Reported

- First checkpoint still not reachable in live play.

Change

- Repositioned first checkpoint from the chimney center to sit over the right top ledge:
  - x: 3.0 -> 4.2
  - y: 15.1 -> 14.9
- This makes checkpoint activation happen from a stable landing spot instead of requiring a precise mid-gap overlap.