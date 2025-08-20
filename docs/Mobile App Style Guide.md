## Gestalts Mobile App Style Guide

This guide captures the established design patterns from the Gestalts mobile app, including the Dashboard (home screen) and Ask Jessie (AI coach) interface. These patterns form the foundation for all subsequent pages and features.

### Design Principles
- **Gentle and supportive**: calm neutrals, warm gradient accents, spacious layouts.
- **Readable first**: large type, high contrast, generous line-height.
- **Delight in moments**: subtle gradients, soft glows, micro-interactions.
- **Accessible**: focus states, touch targets >= 44x44 px, WCAG AA contrast.
- **Consistent input styling**: unified purple-tinted backgrounds for all interactive elements.

### Color System (Updated Tokens)

#### Brand Colors
- **Primary gradient**: `['#7C3AED', '#EC4899', '#FB923C']` (purple → pink → orange)
  - Used for: main backgrounds, primary buttons, accent elements
- **Secondary gradient**: `['#667eea', '#f093fb']`, `['#4facfe', '#00f2fe']` (individual component accents)

#### Neutrals & Surfaces
- **Surface**: `#FFFFFF` (primary white background)
- **Input backgrounds**: `rgba(124,58,237,0.05)` - light purple tint for consistency
- **Selected state**: `rgba(124,58,237,0.08)` - slightly darker for active/selected states
- **Border default**: `rgba(255,255,255,0.2)` on gradient backgrounds, `#E5E7EB` on white
- **Text primary**: `#111827` (dark content text)
- **Text secondary**: `#4B5563` (interface labels, input text, secondary content)
- **Text on gradient**: `white` (high contrast on colored backgrounds)

#### Glass Morphism Effects
- **Card backgrounds**: `rgba(255,255,255,0.85)` with backdrop blur
- **Overlay backgrounds**: `rgba(255,255,255,0.1)` on gradient surfaces
- **Button gloss**: `rgba(255,255,255,0.2)` top highlight overlay

### Typography Scale

#### Font Families
- **Primary**: Plus Jakarta Sans (headings, interface)
- **Secondary**: Inter (body text, labels)
- **Display**: Oooh Baby (accent words only)

#### Mobile Text Sizes
```json
{
  "font": {
    "size": {
      "xs": 10,      // Small labels, badges, timestamps
      "sm": 14,      // Input text, conversation bubbles, buttons  
      "body": 16,    // Standard body text
      "lg": 18,      // Section headers, prominent labels
      "h3": 22,      // Screen titles
      "h2": 28,      // Welcome messages, major headings
      "h1": 32       // Hero titles
    }
  }
}
```

#### Text Color Usage
- **Headers on gradients**: white with semi-bold weight
- **Interface elements**: `tokens.color.text.secondary` for consistency
- **Input text**: `tokens.color.text.secondary` (not primary)
- **Conversation content**: varies by context (white on colored bubbles, dark on white)

### Layout & Spacing

#### Container System
```json
{
  "spacing": {
    "containerX": 20,           // Horizontal screen margins
    "gap": {
      "xs": 8,                  // Minimal spacing
      "sm": 12,                 // Standard component gaps
      "md": 16,                 // Section spacing
      "lg": 24,                 // Major section breaks
      "xl": 32                  // Screen-level spacing
    },
    "sectionY": {
      "sm": 20,                 // Compact vertical sections
      "md": 32,                 // Standard sections
      "lg": 40                  // Generous sections
    }
  }
}
```

#### Screen Structure Pattern
1. **Gradient header** (60pt top padding + content)
2. **Rounded content area** (24pt border radius, white/glass background)
3. **Bottom input area** (when applicable, unified styling)

### Border Radius System
```json
{
  "radius": {
    "sm": 8,
    "lg": 12,
    "xl": 16,
    "2xl": 20,
    "3xl": 24,
    "pill": 9999
  }
}
```

### Component Patterns

#### Page Headers
**Gradient Background Header**
- Linear gradient: `['#7C3AED', '#EC4899', '#FB923C']`
- Top padding: 60pt (accounts for status bar)
- Horizontal padding: `tokens.spacing.containerX`
- Bottom padding: `tokens.spacing.gap.lg`

**Header Controls**
- Left: hamburger menu + title (left-aligned)
- Right: 2-3 icon buttons in `rgba(255,255,255,0.2)` backgrounds
- Icon size: 18pt, white color
- Button size: ~32x32pt with 6pt padding

#### Cards & Surfaces

**Glass Morphism Cards**
```jsx
{
  backgroundColor: 'rgba(255,255,255,0.85)',
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  shadowColor: 'rgba(124,58,237,0.2)',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 10
}
```

**Liquid Glass Circles** (Dashboard feature cards)
- 180pt diameter circles
- `backgroundColor: 'rgba(255,255,255,0.1)'`
- Multiple nested highlight layers
- Scale animation on scroll interaction

#### Input Components

**Universal Input Background**
- Background: `rgba(124,58,237,0.05)` (standard)
- Background: `rgba(124,58,237,0.08)` (selected/active)
- Border radius: `tokens.radius.lg` or `tokens.radius.pill`
- Text color: `tokens.color.text.secondary`

**Rounded Input Container** (Ask Jessie pattern)
```jsx
{
  backgroundColor: 'white',
  borderRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
  padding: tokens.spacing.gap.md
}
```

**Toggle Controls**
- Container: purple tinted background, pill shape
- Active state: brand gradient background, white text
- Inactive state: transparent background, secondary text
- Padding: 8pt horizontal, 3pt vertical
- Font size: 10pt, weight varies by state

#### Interactive Elements

**Quick Action Pills**
```jsx
{
  backgroundColor: 'rgba(124,58,237,0.08)',
  paddingHorizontal: tokens.spacing.gap.sm,
  paddingVertical: 6,
  borderRadius: tokens.radius.pill,
  // No border for clean appearance
}
```

**Primary Buttons**
- Gradient background: brand colors
- Border radius: 22pt (44pt height)
- Icon: 18-20pt, white
- Shadow with brand color tint

**Dropdown Menus**
- White background, subtle shadow
- Border radius: `tokens.radius.lg`
- Item padding: `xs` vertical, `sm` horizontal
- Selected state: purple tinted background
- Dividers: `rgba(0,0,0,0.08)` between items

#### Animation Patterns

**Slide Animations** (Drawers, Sidebars)
```jsx
// Slide in (opening)
duration: 300,
easing: (t) => {
  const p = t - 1;
  return p * p * p + 1; // Ease-out cubic
}

// Slide out (closing)
duration: 250,
easing: (t) => t * t * t // Ease-in cubic
```

**Audio Wave Visualization**
- 8 vertical bars, 3pt width, 1.5pt radius
- Height range: 8-32pt with smooth random animation
- Color: brand gradient start
- Loop timing: 300ms + random(200ms)

### Screen-Specific Patterns

#### Dashboard (Home Screen)
- **Hero section**: Gradient background with greeting text
- **Feature cards**: Horizontal scroll with Shazam-style scale effects
- **Glass content area**: Rounded top corners, white with transparency
- **Action tiles**: Glassmorphic squares with gradient backgrounds
- **Floating FAB**: Gradient microphone button above bottom nav

#### Ask Jessie (Chat Interface)
- **Conversation area**: White background, message bubbles
- **Input container**: Rounded white container with shadow
- **Mode controls**: Compact dropdowns with consistent styling
- **History sidebar**: Right-slide with overlay, white surface
- **Voice visualization**: Animated wave bars in purple tinted container

### Content & Interaction Guidelines

#### Voice & Tone
- **Headers**: Welcome personalization ("Hello [Child]'s parent!")
- **Actions**: Clear, supportive language ("Ask me anything...")
- **States**: Encouraging feedback ("Tap to speak", loading indicators)

#### Touch Targets
- Minimum 44x44pt for all interactive elements
- Comfortable spacing between adjacent touch targets
- Visual feedback on press (scale, color, shadow changes)

#### Loading & Empty States
- Consistent loading indicators using brand colors
- Empty states with relevant icons and helpful messaging
- Graceful degradation for missing data

### Implementation Notes

#### Colors in Code
```jsx
// Use these exact values for consistency
const brandGradient = ['#7C3AED', '#EC4899', '#FB923C'];
const inputBackground = 'rgba(124,58,237,0.05)';
const selectedBackground = 'rgba(124,58,237,0.08)';
const glassBackground = 'rgba(255,255,255,0.85)';
const overlayBackground = 'rgba(255,255,255,0.1)';
```

#### Component Hierarchy
1. Screen-level gradient container
2. Content area with glass morphism
3. Input areas with consistent purple tinting
4. Interactive elements following universal patterns

### Accessibility Standards
- Text contrast meets WCAG AA on all backgrounds
- Touch targets maintain 44pt minimum
- Color is not the only indicator of state
- Voice features include visual feedback
- Focus states are clearly visible

### Quality Checklist
Before implementing new screens, verify:
- [ ] Headers use established gradient and padding
- [ ] Input elements use purple-tinted backgrounds
- [ ] Text sizing follows the established scale
- [ ] Interactive elements meet touch target requirements
- [ ] Glass morphism effects are applied consistently
- [ ] Animations use documented timing and easing
- [ ] Empty and loading states are designed
- [ ] Color contrast meets accessibility standards

---

This style guide captures the polished patterns established in the Dashboard and Ask Jessie screens. Following these patterns ensures visual consistency and user familiarity across the entire application.