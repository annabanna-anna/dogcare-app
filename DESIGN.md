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
  cobalt: "#2344dd"
  blue-task: "#2344dd"
  purple-task: "#9333ea"
  ink: "#141414"
  ink-secondary: "#5c5c5c"
  ink-muted: "#6b7280"
  border-light: "#d1d1d1"
  border-faint: "#e5e7eb"
  nav-inactive: "#78766e"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 700
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
    backgroundColor: "{colors.studio-white}"
    borderColor: "{colors.border-light}"
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
- A warm, dog-forward voice (paw prints, a wagging mascot) kept in check by a bold geometric heading face (Outfit) with real gravity at display sizes, over a humanist workhorse (DM Sans)

## 2. Colors

Four roles: Ember orange as the brand color, Cobalt blue as the secondary accent, and two neutrals — Studio White and warm Card gray — as the canvas. A bench of soft pastels exists only as dog-identity accents. The palette reads bold in small, deliberate doses rather than saturating every surface.

### Brand
- **Ember** (#ff4514): The brand color and the system's voice for action, status, and metadata emphasis — progress bar fill, primary buttons, "done" states, overdue emphasis, selection states, and the uppercase eyebrows/subheads above headings (dates like "Saturday, July 4", breed lines like "Golden Retriever · Large", the "Active" label). If it's coral, it's important.
- **Ember Deep** (#d93a10): Pressed/active state of Ember (buttons, active nav).
- **Ember Soft** (#ffe4da): Faint tint for subtle emphasis backgrounds (belly-patch mascot detail, soft highlights).

### Accent
- **Cobalt** (#2344dd): The secondary accent — a vivid royal blue lifted straight from the splash Lottie animation (orange-and-cobalt pairing, café-signage energy). Its jobs: **page headings** (the Display/Headline tier — "Today", "Dogs", dog names in headers — renders in Cobalt over an Ember eyebrow, the system's signature orange-on-blue pairing), **wayfinding** (the active bottom-nav tab — "where you are" — plus the Dogs A–Z index and the Daily Schedule clock chip), the **medication semantic** (badge, ring highlight), the splash tagline, and brand-illustration linework. Never status or action — Ember owns those.

### Neutral
- **Studio White** (#fcfcfc): The base surface for every screen — a true near-white, deliberately not cream/beige, for a cleaner and more modern read.
- **Card** (#f4f4ef): One step down from Studio White — the resting color for dog cards, chips, and any block that needs to sit "on" the white without a border or shadow.
- **Ink** (#141414): Primary text, mascot linework.
- **Ink Secondary** (#5c5c5c) / **Ink Muted** (#6b7280): Secondary copy and de-emphasized labels, in that order of emphasis.
- **Border Light** (#d1d1d1) / **Border Faint** (#e5e7eb): Hairline dividers (Care Note card border, task timeline connector). Used sparingly — most separation comes from color-blocking, not strokes.

### Named Rules
**The One Voice Rule.** Ember is the only color that means something (status, action, active state). Pastels (Peach, Lavender, Lemon, Mint) exist purely to differentiate dogs and never carry semantic weight — if a pastel starts meaning "done" or "urgent," that's a bug.

**The Avatar Rule.** Photo-less dog avatars are neutral: a light gray block (#f3f4f6) with the `Icon/dog` face glyph in Ink Muted — never the paw icon, never a pastel. (The earlier pastel deck-of-cards rotation is retired; Peach/Lavender/Lemon/Mint remain available as identity accents but are unused in the current screens.)

### Semantic accents (status & task type only)
- **Green Vivid** (#18ba1d): Walk/potty task icons, "done" pills, positive toggles.
- **Blue Task** (= Cobalt #2344dd): Medication — the one task type that gets a ring-highlight treatment, because missing it matters more than missing a walk. Shares the Cobalt accent value so the system has exactly one blue.
- **Purple Task** (#9333ea): Reserved task-type accent (grooming and similar).

## 3. Typography

**Heading Family:** Outfit (with sans-serif fallback) — display, headline, and title tiers: page headings, dog names, card/empty-state titles.
**Body Family:** DM Sans (with sans-serif fallback) — body copy, labels, chips, buttons, form controls, nav labels, and all standalone numerals (times, counts, dates). Numbers inside a heading stay in Outfit with the heading.

**Character:** Outfit at bold weight gives headings real gravity with a clean geometric friendliness — it's what keeps the system from tipping into "kids' app" even with a mascot on screen. DM Sans is the workhorse: a humanist counterpart that stays legible at small sizes and renders numerals (task times, medication doses) clearly at a glance. A geometric/humanist pairing — headings switch family, everything else is DM Sans with weight carrying emphasis.

### Hierarchy
- **Display** (Outfit bold 700, 56px, leading-none, -0.02em, **Cobalt**): "Today" heading — one per app, the single biggest moment on the primary screen.
- **Headline** (Outfit bold 700, 40px, leading-none, **Cobalt**): Page Header title on all secondary screens (Dogs, Dog Profile, Calendar, etc.) — always paired with an Ember eyebrow above it.
- **Title** (Outfit bold 700, 17–22px, leading-tight): Dog Card name, card and empty-state titles.
- **Body** (DM Sans regular 400, 14px, leading-relaxed): Task notes, care-note content, descriptive copy. Kept short — this app is scanned, not read.
- **Label** (DM Sans bold 700, 11–13px, uppercase, tracking-wide): Section eyebrows ("Active Care", "Reminders"), status chips, badges. Always uppercase, always bold — never regular-weight caps.

### Named Rules
**The Numbers Rule.** Standalone numerals — task times, progress counts, dates in list rows — are always DM Sans, never Outfit. The one exception: a number inside a heading (e.g. a Title that includes a time) inherits the heading's Outfit.

### Named Rules
**The Eyebrow Restraint Rule.** Uppercase tracked labels (Label style) are reserved for section headers and status metadata — never used as decorative kicker text above every block. If it's not literally labeling a group of content below it, it doesn't get the eyebrow treatment.

## 4. Elevation

Fully flat. Depth is communicated through color-blocking (White → Card → Ember, each a discrete flat layer) and interaction feedback (`active:scale-[0.97–0.98]` press states, not hover glows), not through shadows. The bottom nav — formerly the one shadow exception — is now a flat Card-colored pill separated from content by color alone.

### Shadow Vocabulary
None. No element in the system uses a drop shadow.

### Named Rules
**The Flat Rule.** Depth cues come from a flatter/lighter background color (Card vs Studio White) and press feedback, never from shadows. If a layer needs more separation, step its background color, don't lift it.

## 5. Components

Tactile and confident: big touch targets, full pill rounding wherever a finger lands, and a satisfying `active:scale` press-down on every tappable surface. Nothing here is precious or fragile-feeling — it's built to be jabbed at one-handed.

### Buttons
- **Shape:** Full pill (`rounded-full`).
- **Primary:** Ember background, white text, bold DM Sans, `active:bg-[Ember Deep]`. Padding scales by size (sm 12×6, md 20×12, lg 24×16).
- **Secondary:** White background, 2px Ink border, Ink text — used when a screen needs a strong action that isn't Ember (e.g., a destructive-adjacent or alternate CTA).
- **Ghost:** Transparent, Ink Secondary text, `active:bg-gray-100` — lowest-emphasis action.
- **Danger:** Soft red background/text pairing (#fee2e2 / #b91c1c), same pill shape — kept visually distinct from Ember so "delete" never gets confused with "brand emphasis."
- **Press feedback:** `transition-all duration-100`, no hover states designed (mobile-first, touch-only).

### Chips (Status / Badges)
- **Style:** Full pill, bold uppercase DM Sans at 11px, tracked wide.
- **State colors:** Pending (gray #f3f4f6/#6b7280), Done (green #dcfce7/#15803d), Skipped (yellow #fef9c3/#a16207), Overdue (red #fee2e2/#b91c1c) — each state owns a fixed background+text pair; never recolor a state ad hoc.

### Cards / Containers
- **Corner Style:** Large rounding (22px) for primary content cards (Dog Card); medium (16px) for secondary containers (Care Note).
- **Background:** Dog cards and active-care chips sit on the app background color (`bg/app` #fcfcfc) and separate with a Border Light hairline; content blocks (Care Note, Behavior/Food sections) are pure White (#ffffff) with the same hairline. Card gray (#f4f4ef) is reserved for utility surfaces: the search pill, the bottom-nav pill, and inline input chips.
- **Shadow Strategy:** None — see Elevation. Separation comes from hairline borders and the white-vs-near-white step.
- **Internal Padding:** 16px standard.
- **Press feedback:** `active:scale-[0.97–0.98]` on any card that navigates somewhere.

### Navigation
- **Style:** A single flat Card-colored pill (#f4f4ef) spanning the app width, fixed to the bottom, containing 4 icon+label nav items in a strict 4-column grid. Active item gets a Cobalt pill-within-the-pill background and white icon/text — the one place the accent marks "where you are" (location, not action); inactive items use Nav Inactive (#78766e). Labels use DM Sans, 11px, medium/bold by active state.
- **Mobile treatment:** This is a mobile-only app frame (max-width 430px); the nav is always fixed-bottom, never a sidebar.

### Signature Component: WaggingDog / Chase-Spin Mascot
A blobby, side-view SVG dog with a continuously wagging tail (`WaggingDog`), used in headers and empty states as a warmth/personality anchor. On the splash screen, a looping Lottie dog animation (`public/splash.lottie`, rendered via `DotLottieReact`) plays on the Studio White canvas — the splash shares the same background as every main screen, with Ink wordmark and secondary tagline. These are the system's signature brand gesture — reserve real personality-driven motion for these two moments rather than spreading generic animation everywhere else.

## 6. Do's and Don'ts

### Do:
- **Do** use Ember (#ff4514) as the only color that carries meaning — status, emphasis, active state. Everything else is identity (pastel avatars) or structure (Ink, Card, White).
- **Do** keep surfaces flat; express depth with `Card` (#f4f4ef) vs `Studio White` (#fcfcfc) layering and `active:scale` press feedback, not shadows.
- **Do** default to full pill shapes (`rounded-full`) for anything tappable: buttons, chips, nav, avatars.
- **Do** keep uppercase tracked labels reserved for real section eyebrows and status chips, not decorative kickers.
- **Do** reserve real, choreographed motion (tail-wag, chase-spin, pop-in) for the mascot and success/loading moments — everyday state changes get simple `transition-colors`/`transition-transform`, not a show.

### Don't:
- **Don't** reintroduce a beige/cream/parchment-tinted background. The base surface is Studio White (#fcfcfc) — a true near-white, chosen explicitly because cream/beige read as generic and "AI-built."
- **Don't** drift toward clinical SaaS-dashboard chrome (cold blues/grays, dense data-table density) — this is a warm, hands-on tool, not an enterprise console.
- **Don't** tip into cartoon-kitsch cuteness (mascot dominating a whole screen, baby-talk copy) — the mascot is an accent, and the display font's weight is what keeps the system feeling like a serious tool.
- **Don't** use a pastel avatar color (Peach/Lavender/Lemon/Mint) to signal status or urgency — those are identity-only colors; Ember and the semantic task-type colors (green/blue/purple) own meaning.
- **Don't** add drop shadows anywhere — the system is fully flat, including the bottom nav.
