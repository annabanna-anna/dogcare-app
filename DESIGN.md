---
name: DogCare
description: Task-tracking companion for dog sitters and boarders — bold coral energy on a crisp white canvas
colors:
  ember: "#ff4514"
  ember-deep: "#d93a10"
  ember-soft: "#ffe4da"
  studio-white: "#fcfcfc"
  card: "#f4f4ef"
  peach: "#ffd7c6"
  lavender: "#c9c6f2"
  lemon: "#f4ec6a"
  mint: "#c9f0d5"
  green-vivid: "#18ba1d"
  blue-task: "#2486ff"
  purple-task: "#9333ea"
  ink: "#141414"
  ink-secondary: "#5c5c5c"
  ink-muted: "#6b7280"
  border-light: "#d1d1d1"
  border-faint: "#e5e7eb"
  nav-inactive: "#78766e"
typography:
  display:
    fontFamily: "Gabarito, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Gabarito, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "Gabarito, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Gabarito, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Gabarito, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  sm: "10px"
  md: "16px"
  lg: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 20px"
  button-primary-active:
    backgroundColor: "{colors.ember-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "12px 20px"
  card-dog:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip-status:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: DogCare

## 1. Overview

**Creative North Star: "The Good Boy Standard"**

DogCare is confident, capable, and a little proud of itself — the visual equivalent of a sitter who has three dogs fed, walked, and medicated before 9am and isn't stressed about it. The system reads bold and poppy (Ember coral against a crisp white canvas, pastel accents for pastel dogs), but every playful choice — the wagging-tail mascot, the pill shapes, the chase-spin loader — sits on top of a genuinely fast, glanceable task list. This is a working tool used mid-shift, one-handed, between a leash and a food bowl; it earns its warmth by staying legible under pressure, not by decoration alone.

The system explicitly rejects the beige/neutral palette this app shipped with originally — that read as generic and "AI-built." It also rejects both directions a dog-care app could drift toward: clinical SaaS-blue dashboard chrome (wrong register for a hands-on, physical job), and cartoon-kitsch pet-app cuteness that undermines trust in a tool people rely on for medication timing.

**Key Characteristics:**
- One committed accent (Ember coral) carries all emphasis and status meaning — it is never "just decorative"
- Flat, color-blocked surfaces; depth comes from scale-press feedback, not shadows
- Pill shapes everywhere load-bearing touch happens: buttons, nav, chips, avatars
- A warm, dog-forward voice (paw prints, a wagging mascot) kept in check by a single extrabold sans with real gravity at display sizes

## 2. Colors

Ember, White, and a bench of soft pastels used only as dog-identity accents — the palette reads bold in small, deliberate doses rather than saturating every surface.

### Primary
- **Ember** (#ff4514): The system's one voice for meaning — active nav tab, progress bar fill, primary buttons, "done" states, overdue emphasis, header eyebrows. If it's coral, it's important.
- **Ember Deep** (#d93a10): Pressed/active state of Ember (buttons, active nav).
- **Ember Soft** (#ffe4da): Faint tint for subtle emphasis backgrounds (belly-patch mascot detail, soft highlights).

### Neutral
- **Studio White** (#fcfcfc): The base surface for every screen — a true near-white, deliberately not cream/beige, for a cleaner and more modern read.
- **Card** (#f4f4ef): One step down from Studio White — the resting color for dog cards, chips, and any block that needs to sit "on" the white without a border or shadow.
- **Ink** (#141414): Primary text, mascot linework, bottom-nav background.
- **Ink Secondary** (#5c5c5c) / **Ink Muted** (#6b7280): Secondary copy and de-emphasized labels, in that order of emphasis.
- **Border Light** (#d1d1d1) / **Border Faint** (#e5e7eb): Hairline dividers (Care Note card border, task timeline connector). Used sparingly — most separation comes from color-blocking, not strokes.

### Named Rules
**The One Voice Rule.** Ember is the only color that means something (status, action, active state). Pastels (Peach, Lavender, Lemon, Mint) exist purely to differentiate dogs and never carry semantic weight — if a pastel starts meaning "done" or "urgent," that's a bug.

**The Avatar Palette Rule.** Peach (#ffd7c6) / Lavender (#c9c6f2) / Lemon (#f4ec6a) / Mint (#c9f0d5) rotate by list index to give a "deck of cards" feel to Dog List avatars — assign by position, not by breed or any semantic property, so the rotation stays visually random and low-stakes.

### Semantic accents (status & task type only)
- **Green Vivid** (#18ba1d): Walk/potty task icons, "done" pills, positive toggles.
- **Blue Task** (#2486ff): Medication — the one task type that gets a ring-highlight treatment, because missing it matters more than missing a walk.
- **Purple Task** (#9333ea): Reserved task-type accent (grooming and similar).

## 3. Typography

**Type Family:** Gabarito (with sans-serif fallback), carrying display, headline, title, body, and label — one family in multiple weights rather than a display/body pairing.
**Label/Nav Font:** Plus Jakarta Sans (bottom nav labels only)

**Character:** Gabarito at extrabold weight gives headings real gravity and a slightly rounded, friendly geometry — it's what keeps the system from tipping into "kids' app" even with a mascot on screen. At regular weight it's the workhorse: legible at small sizes, confident in bold, used for everything from task titles to body copy to all-caps eyebrows. One family, weight and size carry the hierarchy instead of a font switch.

### Hierarchy
- **Display** (extrabold 800, 56px, leading-none, -0.02em): "Today" heading — one per app, the single biggest moment on the primary screen.
- **Headline** (extrabold 800, 40px, leading-none): Page Header title on all secondary screens (Dogs, Dog Profile, Calendar, etc.).
- **Title** (extrabold 800, 20px, leading-tight): Dog Card name, section-level titles.
- **Body** (regular 400, 14px, leading-relaxed): Task notes, care-note content, descriptive copy. Kept short — this app is scanned, not read.
- **Label** (extrabold 800, 11–13px, uppercase, tracking-wide): Section eyebrows ("Active Care", "Reminders"), status chips, badges. Always uppercase, always extrabold — never regular-weight caps.

### Named Rules
**The Eyebrow Restraint Rule.** Uppercase tracked labels (Label style) are reserved for section headers and status metadata — never used as decorative kicker text above every block. If it's not literally labeling a group of content below it, it doesn't get the eyebrow treatment.

## 4. Elevation

Flat by default. Depth is communicated through color-blocking (White → Card → Ember, each a discrete flat layer) and interaction feedback (`active:scale-[0.97–0.98]` press states, not hover glows), not through shadows. The one deliberate exception is the bottom navigation, which is a physically floating object over content and earns a real shadow to sell that.

### Shadow Vocabulary
- **Floating-nav** (`box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)` / Tailwind `shadow-lg`): The bottom nav pill only. Nothing else in the system uses a shadow.

### Named Rules
**The Flat-Except-Floating Rule.** If an element is genuinely floating over content (like the bottom nav), it gets a shadow. If it's a card or block sitting inline in the flow, it gets a flatter/lighter background color instead — never both a shadow and a background shift for the same depth cue.

## 5. Components

Tactile and confident: big touch targets, full pill rounding wherever a finger lands, and a satisfying `active:scale` press-down on every tappable surface. Nothing here is precious or fragile-feeling — it's built to be jabbed at one-handed.

### Buttons
- **Shape:** Full pill (`rounded-full`).
- **Primary:** Ember background, white text, extrabold Gabarito, `active:bg-[Ember Deep]`. Padding scales by size (sm 12×6, md 20×12, lg 24×16).
- **Secondary:** White background, 2px Ink border, Ink text — used when a screen needs a strong action that isn't Ember (e.g., a destructive-adjacent or alternate CTA).
- **Ghost:** Transparent, Ink Secondary text, `active:bg-gray-100` — lowest-emphasis action.
- **Danger:** Soft red background/text pairing (#fee2e2 / #b91c1c), same pill shape — kept visually distinct from Ember so "delete" never gets confused with "brand emphasis."
- **Press feedback:** `transition-all duration-100`, no hover states designed (mobile-first, touch-only).

### Chips (Status / Badges)
- **Style:** Full pill, extrabold uppercase Gabarito at 11px, tracked wide.
- **State colors:** Pending (gray #f3f4f6/#6b7280), Done (green #dcfce7/#15803d), Skipped (yellow #fef9c3/#a16207), Overdue (red #fee2e2/#b91c1c) — each state owns a fixed background+text pair; never recolor a state ad hoc.

### Cards / Containers
- **Corner Style:** Large rounding (22px) for primary content cards (Dog Card); medium (16px) for secondary containers (Care Note).
- **Background:** Card gray (#f4f4ef) on White for list items; White with a Border Light hairline for content blocks (Care Note) that need to feel more like a form section than a tappable item.
- **Shadow Strategy:** None — see Elevation. Depth is the Card-vs-White contrast alone.
- **Internal Padding:** 16px standard.
- **Press feedback:** `active:scale-[0.97–0.98]` on any card that navigates somewhere.

### Navigation
- **Style:** A single floating Ink-black pill spanning the app width, fixed to the bottom, containing 4 icon+label nav items. Active item gets an Ember pill-within-the-pill background and white icon/text; inactive items are white at 50% opacity. Labels use Plus Jakarta Sans (the only place this font appears), 11px, medium/bold by active state.
- **Mobile treatment:** This is a mobile-only app frame (max-width 430px); the nav is always fixed-bottom, never a sidebar.

### Signature Component: WaggingDog / Chase-Spin Mascot
A blobby, side-view SVG dog with a continuously wagging tail (`WaggingDog`), used in headers and empty states as a warmth/personality anchor. On the splash screen, a variant curls the same dog into a circle chasing its own tail as the loading animation (`chase-spin`). These are the system's signature brand gesture — reserve real personality-driven motion for these two moments rather than spreading generic animation everywhere else.

## 6. Do's and Don'ts

### Do:
- **Do** use Ember (#ff4514) as the only color that carries meaning — status, emphasis, active state. Everything else is identity (pastel avatars) or structure (Ink, Card, White).
- **Do** keep surfaces flat; express depth with `Card` (#f4f4ef) vs `Studio White` (#fcfcfc) layering and `active:scale` press feedback, not shadows — except the floating bottom nav.
- **Do** default to full pill shapes (`rounded-full`) for anything tappable: buttons, chips, nav, avatars.
- **Do** keep uppercase tracked labels reserved for real section eyebrows and status chips, not decorative kickers.
- **Do** reserve real, choreographed motion (tail-wag, chase-spin, pop-in) for the mascot and success/loading moments — everyday state changes get simple `transition-colors`/`transition-transform`, not a show.

### Don't:
- **Don't** reintroduce a beige/cream/parchment-tinted background. The base surface is Studio White (#fcfcfc) — a true near-white, chosen explicitly because cream/beige read as generic and "AI-built."
- **Don't** drift toward clinical SaaS-dashboard chrome (cold blues/grays, dense data-table density) — this is a warm, hands-on tool, not an enterprise console.
- **Don't** tip into cartoon-kitsch cuteness (mascot dominating a whole screen, baby-talk copy) — the mascot is an accent, and the display font's weight is what keeps the system feeling like a serious tool.
- **Don't** use a pastel avatar color (Peach/Lavender/Lemon/Mint) to signal status or urgency — those are identity-only colors; Ember and the semantic task-type colors (green/blue/purple) own meaning.
- **Don't** add drop shadows to inline cards or buttons. Shadow is reserved for the one genuinely floating element, the bottom nav.
