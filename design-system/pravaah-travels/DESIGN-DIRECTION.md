# Pravaah Field Atlas

## Creative direction

Pravaah is presented as a living field atlas rather than a generic tour marketplace. The interface should feel like a well-edited travel publication with an operating booking desk behind it: documentary photography, generous paper space, hard editorial edges, route numbers, and short notes that help a traveller decide.

The visual language is deliberately distinct from the previous green-and-cream Vitour-style system and from the EpicTrips template. EpicTrips contributes the confidence of large imagery and clear travel hierarchy; Pravaah adds a Himalayan field-journal voice, quieter conversion moments, and a more authored composition.

## Tokens

- Ink: `#0B1110`
- Paper: `#F1F0E9`
- Limestone: `#E2E3DC`
- Mist: `#D7E1DF`
- Lichen: `#5B746F`
- Mineral blue: `#2E92A0`
- Signal rust: `#C96945`
- Charcoal: `#2A3431`
- Display: Syne, variable 400-800
- Text: Instrument Sans, variable 400-700

The palette is intentionally multi-hued. Rust and mineral blue are signals for action and information, not decorative gradients. Cards use sharp or lightly rounded image frames, never nested floating cards.

## Composition rules

- Home leads with a split field note: a dark editorial text panel and a full-height Himalayan image.
- Destination pages use an index and an asymmetric route archive, not a uniform card wall.
- Package listing uses a numbered editorial collection with the filter controls as a quiet utility band.
- Package detail makes the journey image, route facts, itinerary, and enquiry action visible in the first decision cycle.
- Gallery and journal use real image crops and staggered masonry-like rhythm.
- Every primary image must be destination or package relevant. Generic or unrelated fallback images are not acceptable.

## Motion language

- Mood: calm, observant, cinematic.
- Hero: one-time image scale settle and clipped text entrance, 700-900ms.
- Scroll: short y/clip reveals, 450-650ms, staggered by reading order.
- Hover: image translate/scale and underline or border response, 220-420ms.
- Navigation and modal states: crisp 180-320ms presence transitions.
- No bounce or elastic easing for premium travel content.
- Reduced motion renders all content immediately and disables parallax.

## Responsive behavior

At 1440px the page is a broad editorial canvas with 72-96px section breathing room. At 768px the index and imagery collapse intentionally into a reading-first sequence. At 390px, utility controls become stacked, image frames retain stable aspect ratios, and the sticky enquiry action remains reachable without hiding content.

## Image ownership map

- Home hero / trust: Buran Ghati and Roopkund local editorial assets.
- Destinations: destination story CMS images, then matching package images, then verified local landscape fallback.
- Package cards and detail gallery: package-owned image fields only, with local route fallback only when the package has no usable image.
- Gallery: published gallery records only; the gallery page fallback is a local field-journal frame.
- Custom Roopkund and Buran Ghati landings retain their independent image systems.
