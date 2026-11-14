# CLAUDE.md

## Design Context

This project has a documented design system — read before making UI changes:

- **PRODUCT.md**: who this app is for (dog sitters/boarders managing multiple dogs), brand personality, anti-references.
- **DESIGN.md**: the visual system — colors (Ember coral as the one meaningful accent, Studio White base), typography (Gabarito for everything, one family in multiple weights), flat-by-default elevation, component specs. Sidecar detail in `.impeccable/design.json`.

Rule for edit screens (see DESIGN.md › Buttons): Save stays disabled until something has actually changed.

Rule for dog photos (see DESIGN.md › The Shape Match Rule): a photo matches its container — round inside a pill, concentric corners inside a card.

North Star: "The Good Boy Standard" — bold and playful, but never at the cost of being fast and legible for someone mid-shift, one-handed.
