# Pointillist Monochrome Homepage

A lightweight example homepage demonstrating a **monochrome, pointillist dot-field system** used as an interface surface rather than a decorative effect.

This project explores how **state, intent, and transformation** can be communicated visually using a single dot field, while keeping text, content, and accessibility clear and conventional.

---

## What this is

- A **single-page demo** built to test a visual system
- One persistent dot field that reconfigures based on user intent
- A strict black/white palette with light and dark modes
- Solid, readable typography layered over a dynamic system

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

- Sections stabilise as they become important
- Navigation emerges only on intent
- Proof reduces motion to signal trust

If motion draws attention to itself, it is too strong.

---

## What the page demonstrates

- Hero section where meaning resolves from a dispersed field
- Intent-driven navigation (no persistent nav bar)
- Content sections as local “density islands”
- Proof section with noticeably dampened motion
- Footer that dissolves rather than terminates
- Dark/light mode switching via polarity inversion

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
- Cohesion (attraction to anchors)
- Stability (damping)
- Noise (micro-jitter)

Rather than full physics, the system uses **anchor-driven reconfiguration** to stay lightweight.

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

Example (adjust to your setup):

```bash
npm install
npm run dev
```

Or simply open `index.html` if no build step is used.

---

## Design constraints (summary)

- Black/white only
- One dot field
- No dot-based typography
- No decorative motion
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