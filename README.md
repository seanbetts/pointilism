# Pointilism (Monochrome Dot Field)

A lightweight example homepage demonstrating a **monochrome, pointillist dot-field system** used as an interface surface rather than a decorative effect.

This project explores how **state, intent, and transformation** can be communicated visually using a single dot field, while keeping text, content, and accessibility clear and conventional.

---

## What this is

- A **single-page demo** built to test a visual system
- One persistent dot field under a readable, solid UI layer
- A strict black/white palette with light and dark modes
- Simple controls to explore density, sizing, motion, and “events” (drop/breathing)

This is **not**:
- A particle animation demo
- A brand site
- A showcase of generative typography

---

## Core principles

### 1. Monochrome discipline
The interface exists in only two states:

- **Dark mode**: white dots on black
- **Light mode**: black dots on white

No colour, gradients, textures, or imagery are used. All hierarchy comes from **density, motion, and stability**.

---

### 2. Dots represent system state
Dots are not decoration.

They encode:
- Focus
- Relevance
- Confidence
- Transition

The same dots persist across the entire page and are continuously reconfigured rather than replaced.

---

### 3. Text is never pointillist
All readable text is rendered using a **standard solid font**.

- Dots never form letters
- Text never pixelates, morphs, or dissolves
- Dots may respond *around* text, but never *become* text

This separation is intentional:

- **Dots = intelligence and state**
- **Text = meaning and clarity**

---

### 4. Motion communicates meaning
Motion is functional, not expressive.

- Drift should feel calm by default
- “Events” (like a drop) should be brief and readable

If motion draws attention to itself, it is too strong.

---

## Controls

The dot controls live in an **Explore** panel (hidden by default):

- **Presets**: curated one-click states to show range (presets don’t change light/dark mode).
  - `Origin` (defaults)
  - `Breathe`
  - `Grains`
  - `BOND`
  - `Teseract`
  - `Matrix`
- **Min size / Max size**: dot radius bounds (CSS pixels).
- **Size count**: number of discrete sizes between min/max.
- **Size distribution**: how sizes are allocated across those buckets (e.g. small-biased).
- **Density**: how many dots are spawned.
- **Speed**: how quickly drift settles (breathing is independent).
- **Breathing**: larger dots oscillate at a fixed tempo; exhale nudges nearby dots.
- **Grid**: snaps dots into a screen-wide grid (breathing is disabled while grid is on).
- **DROP**: applies a brief “gravity drop” to stack dots at the bottom (also unfreezes, turns off grid, and turns on breathing).
- **RESTART**: respawns using the current settings and unfreezes.
- **FREEZE / UNFREEZE**: pauses/resumes animation.
- **Mode**: light/dark polarity inversion.

Any manual change to a slider/toggle clears the active preset highlight (mode toggle excluded).

---

## Technical approach

### Stack
- HTML for content and semantics
- CSS for layout, typography, modes, and fallbacks
- Vanilla JavaScript for state and motion
- Canvas 2D for dot rendering

No third-party animation libraries are required.

---

### Dot-field model (simplified)
Each dot tracks:

- Position (`x`, `y`)
- Velocity (`vx`, `vy`)
- Size
- Opacity

Global parameters control:

- Density
- Stability (damping)
- Drift (a smooth noise field)

The engine enforces strict layout constraints:

- Dots are **non-overlapping** with a small buffer by default.
- Dots avoid the screen edges (edge padding).
- In **grid mode**, collisions are softened/temporarily disabled so dots can reach their assigned grid homes without getting stuck.

Collisions are resolved via a spatial hash + iterative separation, with a contact feel that mixes bounce/stick (and disables stickiness/coupling while breathing).

---

## Accessibility

Accessibility is a first-class concern:

- All content exists in the HTML layer
- Supports `prefers-reduced-motion`
  - Dot field freezes or reduces to minimal drift
- Text contrast meets WCAG AA independently of dots
- Full keyboard navigation support

The experience remains usable even if the dot field is disabled.

---

## Performance goals

This demo is designed to be intentionally small:

- Dependency-free runtime
- Single canvas
- Adaptive dot count based on device
- Animation paused when tab is hidden

Target budgets:

- JavaScript (minified, excluding tooling): ~10–20KB
- Smooth performance on a modern laptop and phone

---

## Running the project

This prototype uses native ES modules, so run it from a local static server.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` and load `index.html`.

---

## Design constraints (summary)

- Black/white only
- One dot field
- No dot-based typography
- No UI chrome that breaks the illusion of a single system

If something looks impressive but does not communicate state or intent, it does not belong.

---

## Status

This is an **exploratory prototype**.

It is intended as a reference implementation for:
- Designers exploring AI-native interfaces
- Developers testing lightweight generative systems
- Teams interested in stateful, agent-friendly surfaces

---

## License

TBD
