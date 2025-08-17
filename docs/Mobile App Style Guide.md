## Gestalts Mobile App Style Guide

This guide translates the current website's visual language into a mobile design system. It captures tokens, components, and interaction patterns observed across the landing page sections (`Header`, `Hero`, `ProblemSection`, `StorySection`, `FeaturesSection`, `GLPSection`, `PricingSection`, `TestimonialsSection`).

### Design Principles
- **Gentle and supportive**: calm neutrals, warm gradient accents, spacious layouts.
- **Readable first**: large type, high contrast, generous line-height.
- **Delight in moments**: subtle gradients, soft glows, micro-interactions.
- **Accessible**: focus states, touch targets >= 44x44 px, WCAG AA contrast.

### Color System (Tokens)
- **Brand gradient**:
  - `color.brand.gradient.start` = `#5B21B6` (Tailwind `purple-800`)
  - `color.brand.gradient.mid` = `#EC4899` (Tailwind `pink-500`)
  - `color.brand.gradient.end` = `#FB923C` (Tailwind `orange-400`)
- **Neutrals**:
  - `color.surface` = `#FFFFFF`
  - `color.bg.muted` = `#F9FAFB` (gray-50)
  - `color.border.default` = `#E5E7EB` (gray-200)
  - `color.border.hover` = `#D1D5DB` (gray-300)
  - `color.text.primary` = `#111827` (gray-900)
  - `color.text.secondary` = `#4B5563` (gray-600)
- **Supporting accents (used in content examples)**:
  - `color.support.green` = `#22C55E` (green-500)
  - `color.support.blue` = `#3B82F6` (blue-500)
  - `color.support.teal` = `#14B8A6` (teal-500)
  - `color.support.yellow` = `#EAB308` (yellow-500)

Usage:
- Primary actions and highlight text use the 3-stop brand gradient.
- Cards use white surfaces with subtle gray borders and gradient "glow" backdrops.

### Typography
- **Families**
  - `font.family.primary`: "Plus Jakarta Sans", fallback `-apple-system, system-ui, sans-serif`
  - `font.family.secondary`: "Inter", fallback system sans
  - `font.family.accent`: "Oooh Baby" for single-word expressive accents (sparingly)
- **Mobile scales**
  - `font.h1`: 32–36, semi-bold, `line-height` 1.2
  - `font.h2`: 28–32, semi-bold, `line-height` 1.25
  - `font.h3`: 22–24, semi-bold, `line-height` 1.3
  - `font.body`: 16, regular, `line-height` 1.6
  - `font.small`: 14, medium, `line-height` 1.5
  - `font.caption`: 12–13, medium
- **Rules**
  - Use `primary` for headings and body; reserve `accent` for 1–2 words in hero/headers.
  - Keep paragraph width comfortable; prefer 60–70 character measure where possible.

### Spacing & Layout
- **Base grid**: 4px unit.
- **Container padding**: horizontal 16; section vertical spacing 24–32 (can scale up to 40 for feature sections).
- **Card padding**: 16–24.
- **Gaps**: 8, 12, 16 between elements; 24–32 between blocks.
- **Headers**: sticky header allowed; translucent gradient scrim OK on scroll.

### Radius & Elevation
- **Radii**
  - `radius.pill` = 9999 (full)
  - `radius.lg` = 12
  - `radius.2xl` = 16
- **Elevation**
  - `elevation.0`: border-only, no shadow
  - `elevation.1`: shadow-sm (e.g., 0 5 10 rgba(0,0,0,0.12))
  - `elevation.2`: shadow-md (e.g., 0 8 30 rgba(0,0,0,0.12))
  - Hover/press can slightly increase elevation; keep subtle.

### Gradients & Glows
- **Primary gradient (buttons, highlights)**: left-to-right from `brand.start` -> `brand.mid` -> `brand.end`.
- **Backdrop glow**: large blurred circle with low-opacity brand gradient (10–20%) behind cards/CTAs.
- **Text gradient**: apply brand gradient as `bg-clip:text` on accent words.

### Motion & Interactions
- **Durations**: 200–300ms for standard transitions; 150ms for tap feedback.
- **Easing**: `ease-out` on entrance/hover; `ease-in-out` for subtle repeats.
- **Tap feedback**: scale to 0.98 or 1.02; increase elevation or glow slightly.
- **Ambient animations**: optional gentle bounce for pointers/arrows; avoid continuous motion near primary reading areas.

### Component Library (Mobile Specs)
- **App Header**
  - Height 56–64; white surface with bottom divider `color.border.default`.
  - Left: brand mark; Right: primary CTA or menu.
  - Optional subtle gradient scrim background.

- **Primary Button (Gradient Pill)**
  - Height 48–56, `radius.pill`.
  - Background: brand 3-stop gradient; white text.
  - Optional underglow: blurred gradient behind (8–12 blur, 60–80% opacity).

- **Secondary Button (Outline)**
  - Height 44–52, `radius.pill` or `radius.lg`.
  - Border `color.border.default`; text `color.text.primary`.
  - Hover/press: bg `#F3F4F6` (gray-100), border `color.border.hover`.

- **Badge / Pill**
  - XS text (12–13), medium weight.
  - Solid gradient chip or muted gray pill depending on context.

- **Section Header**
  - Eyebrow (small, secondary color) + H2 + lead paragraph.
  - Center-aligned on marketing pages; left-aligned in product.

- **Card (Feature/Story/Tool)**
  - Surface `color.surface`; border `color.border.default`; `radius.2xl`.
  - Padding 16–24; optional image/illustration area.
  - Hover/press: border to `color.border.hover`, elevation to `elevation.2`.
  - Optional backdrop glow behind card using brand gradient at 10–20%.

- **Testimonial Card**
  - Same as Card with avatar (40), name (semibold), role/caption (small), 5-star row.
  - Quote text uses body size 15–16, `color.text.secondary`.

- **Stats Tile**
  - Large numeric (32–40) with gradient text; caption below (14–16).

- **Pricing Card**
  - Border emphasis: free = gray border; premium = brand-tinted border.
  - Feature rows with small check icons; CTA full-width gradient button.

- **Journey/Stage Chip**
  - Circular gradient number marker + label + example box in muted gray surface.

### Imagery & Illustration
- Use clean, high-contrast PNG/SVGs. Keep imagery right-balanced in hero; text left.
- Maintain adequate padding around images; avoid edge-to-edge unless intentional.
- Prefer simple line icons (2px strokes) with neutral color; use gradient fills sparingly.

### Accessibility
- Minimum body 16; do not drop below 14 for supportive text.
- Contrast: gradient text must meet AA against background; add subtle shadow if needed.
- Touch targets >= 44x44; maintain spacing for complex cards.
- Provide visible focus states (use 2px brand or blue outline) and reduce motion option.

### Content Tone
- **Voice**: empathetic, practical, de-jargonized.
- **Patterns**: validate feelings, clarify "what to do next", celebrate small wins.

### Token Reference (JSON-like)
```json
{
  "color": {
    "brand": { "gradient": { "start": "#5B21B6", "mid": "#EC4899", "end": "#FB923C" } },
    "surface": "#FFFFFF",
    "bg": { "muted": "#F9FAFB" },
    "border": { "default": "#E5E7EB", "hover": "#D1D5DB" },
    "text": { "primary": "#111827", "secondary": "#4B5563" }
  },
  "font": {
    "family": { "primary": "Plus Jakarta Sans", "secondary": "Inter", "accent": "Oooh Baby" },
    "size": { "h1": 34, "h2": 30, "h3": 24, "body": 16, "small": 14, "caption": 12 }
  },
  "radius": { "pill": 9999, "lg": 12, "2xl": 16 },
  "elevation": { "0": "border-only", "1": "0 5 10 rgba(0,0,0,0.12)", "2": "0 8 30 rgba(0,0,0,0.12)" },
  "spacing": { "unit": 4, "containerX": 16, "sectionY": [24, 32] }
}
```

### Platform Implementation Hints
- **React Native**: use `react-native-linear-gradient` for buttons, `react-native-reanimated` for tap scale, and `Pressable` with `android_ripple` on Android. Consider `nativewind` to mirror Tailwind spacing and radii.
- **SwiftUI**: `LinearGradient(gradient: Gradient(colors:[start, mid, end]), startPoint: .leading, endPoint: .trailing)` with `.clipShape(Capsule())`; use `.shadow` tokens and `.scaleEffect` on press.

### Do/Don't
- **Do**: reserve accent script font for single, emotionally charged words.
- **Do**: keep gradients subtle on backgrounds; strong on CTAs only.
- **Don't**: stack multiple animated elements near dense text.
- **Don't**: mix too many accent colors in the same view.

---
This guide mirrors the landing page's current patterns while adapting to mobile constraints. If we later add dark mode, we can extend tokens with `-dark` variants and invert gradient usage on surfaces.
