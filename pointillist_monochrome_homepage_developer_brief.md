# Developer Brief: Pointillist Monochrome Homepage (Example Build)

## Goal
Build a single-page example homepage that uses a **pointillist dot-field system** as the foundational UI language.

The site must feel like a **single coherent system** (one field, many states), not a normal page with decorative particles.

This is a demonstration of *state, intent, and transformation*, not an animation demo.

---

## Non-negotiables

### Monochrome only
- **Dark mode (primary):**
  - Background: `#000000`
  - Dots: `#FFFFFF`
  - Text: white / off-white only
- **Light mode (secondary):**
  - Background: `#FFFFFF`
  - Dots: `#000000`
  - Text: black / near-black only

No gradients, glows, colour accents, imagery, or textures.

### Dots are system, not decoration
- Dots are the **only graphical element**.
- They represent system state, intent, and transformation.
- They are never illustrative or ornamental.

### Text is never pointillist
- **Text must never be rendered using dots.**
- No dot-based lettering, pixelated text, or morphing glyphs.
- All readable text is rendered using a **standard solid font** at all times.

### Motion and accessibility
- Motion must be subtle, intentional, and performance-safe.
- Full support for reduced-motion users.
- Content must remain readable and usable with dots disabled or frozen.

---

## Deliverable

A working example homepage (static content) demonstrating the system:

- Hero section with dot-field driven reveal
- Intent-driven navigation (emerges on hover/focus)
- 2 to 3 content sections (“density islands”)
- Proof / credibility section with motion dampening
- Footer with dissolution
- Dark/light mode toggle (or system preference + toggle)

Provide:
- Source code
- README with run instructions
- Notes on performance, accessibility, and trade-offs

---

## Recommended implementation approach

- **Single canvas** (Canvas 2D preferred) for the dot field, full-page, behind content
- HTML for all content and semantics
- CSS for layout, typography, modes, and fallbacks
- Lightweight JS controller to manage dot-field state

### Suggested stack (example, not mandatory)
- Plain HTML / CSS / JS + Vite
- React or Next.js acceptable, but not required

No animation libraries unless absolutely necessary.

---

## Architecture

### Layers
1. **DotFieldLayer (Canvas)**
   - Renders and updates dots
2. **ContentLayer (HTML)**
   - Semantic structure, accessibility, text
3. **StateController (JS)**
   - Maps user intent (scroll, hover, focus, mode) to dot-field parameters

### Dot model
Each dot:
- `x`, `y`
- `vx`, `vy`
- base size
- opacity

Global parameters:
- `density`
- `cohesion` (attraction to anchors)
- `stability` (damping)
- `noise` (micro-jitter)
- `maxVelocity`

---

## Typography

### Rules
- Text is **always solid**.
- Text does not animate, morph, pixelate, or dissolve.
- Dots may respond *around* text, but never form it.

### Typeface guidance
Choose a typeface that is:
- Neutral
- Human
- Precise
- Contemporary

Good fits:
- Modern grotesks (e.g. Inter, Helvetica Now–style)
- Restrained humanist sans-serifs

Avoid:
- Display fonts
- Sci-fi or “techy” typefaces
- Overly geometric faces that compete with the dots

### Usage
- Headings: medium weight, calm tracking
- Body copy: static, readable, never animated
- Links and CTAs:
  - Introduced via nearby dot behaviour
  - Text itself remains stable

Intentional separation:
- **Dots = intelligence and state**
- **Text = meaning and clarity**

---

## Page specification

### 1. Global dot field (always present)
- Covers entire viewport
- Resizes responsively
- Uses `requestAnimationFrame`
- One persistent field for the entire page
- Must never distract from reading

### 2. Hero section
**Intent:** meaning forms from the field, then resolves into clarity.

Example content:
- Headline: “Intelligence, resolved.”
- Subline: “A monochrome, stateful surface for ideas.”
- Primary CTA: “Explore”

Behaviour:
- Initial state: dispersed dots, low cohesion
- After short settle (600–900ms): subtle clustering toward centre
- Headline appears as solid text, synchronised with cohesion
- CTA introduced via local density increase, then label fade-in

### 3. Navigation (intent-driven)
**No persistent nav bar.**

Nav items (example): About, Work, Thinking, Contact

Behaviour:
- Idle: faint, low-density dot band at top
- On pointer proximity or keyboard focus:
  - dots tighten into label anchors
  - labels fade in
- Active item:
  - increased stability and density

Constraints:
- No overlays or panels
- Never blocks content

### 4. Content sections (“density islands”)
Create 2–3 stacked sections.

Each section:
- H2 title
- Short paragraph
- Text link

Behaviour:
- Enter viewport: local cohesion increases
- Exit viewport: dots disperse

Hierarchy:
- Importance is communicated through **density and stillness**, not colour

### 5. Proof / credibility section
**Intent:** stability communicates trust.

Example content:
- “Proof”
- 3 bullets or cards (HTML only)

Behaviour:
- Strong motion dampening
- Reduced noise
- Optional soft lattice alignment

### 6. Footer
**Intent:** dissolve rather than terminate.

Behaviour:
- Reduced dot density
- Gentle downward drift bias
- Links remain readable but visually understated

---

## Interaction mapping

### Hover / focus
- Top-edge hover: nav anchors activate
- CTA or link hover: local cohesion increase
- Keyboard focus mirrors hover behaviour

### Scroll
- Use `IntersectionObserver` to detect active section
- Active section adjusts local dot parameters

### Mode toggle (dark / light)
- Palette switches via **polarity inversion**, not fades
- Transition:
  1. Brief dispersion
  2. Colour inversion
  3. Re-cohere to current state

Respect `prefers-color-scheme` as default.

---

## Motion constraints
- No elastic or bouncy easing
- Linear or minimal ease-in-out only

Timing guidelines:
- Nav reveal: 150–250ms
- Section transitions: 400–600ms
- Hero formation: up to 800ms

Target feel: *calm competence*.

---

## Accessibility
- Support `prefers-reduced-motion`
  - Freeze field or reduce to minimal drift
  - Replace reconfiguration with opacity changes
- Text contrast must meet WCAG AA independently of dots
- Dots must not sit at full opacity directly behind body text
- All navigation and links must be keyboard accessible

---

## Performance

- Dependency-free build preferred
- Canvas 2D over DOM/SVG or heavy WebGL
- Simple motion model only (drift + noise + anchor pull)
- No neighbour searches or expensive physics

### Adaptive quality
- Mobile: ~300–800 dots
- Desktop: ~800–1800 dots
- Reduce dot count or update frequency if frame time degrades
- Pause animation when tab is hidden

### Rendering rules
- Filled circles only
- No shadows, glows, gradients
- Batch draw calls

### Budget targets
- JS (minified, excluding tooling): **10–20KB**
- No third-party runtime libraries

---

## Acceptance checklist
- Monochrome enforced in both modes
- One persistent dot field canvas
- Text always rendered via standard font
- Nav emerges on intent; no persistent bar
- Sections affect local field behaviour
- Proof section clearly stabilised
- Footer dissolves
- Reduced-motion mode works
- Smooth performance on modern laptop and phone

---

## Open questions
- Vanilla JS vs React/Next preference
- Whether to include optional soft lattice in proof section
- Final typeface choice

