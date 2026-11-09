# KindMinds DESIGN.md
## Humanitarian Bauhaus × Neumorphism Design Token Manifest

> This file is the single source of truth for all design decisions on KindMinds.
> It is consumed by the `design-engineering tokens` skill verb.
> Changes here should propagate to `tailwind.config.ts` and `src/styles/globals.css`.

---

## Brand Identity

**Aesthetic Direction:** Humanitarian Bauhaus × Soft Neumorphism  
**Personality:** Calm. Trustworthy. Accessible. Operationally clear. Humane.  
**Anti-patterns:** Alarming red everywhere, excessive gradients, dark mode drama, confetti animations, glassmorphism stacks.

---

## Color Tokens

### Surfaces (Neumorphic base)
| Token | Hex | Usage |
|---|---|---|
| `surface` | `#F5F0E8` | Page background, default card fill |
| `surface-raised` | `#EDE8DF` | Slightly elevated cards, hover backgrounds |
| `surface-inset` | `#DDD8CF` | Inset well, depressed state |
| Neu shadow dark | `#D6D0C5` | Neumorphic dark shadow |
| Neu shadow light | `#FFFFFF` | Neumorphic light shadow |

### Brand Palette
| Token | Hex | OKLCH equivalent | Usage |
|---|---|---|---|
| `terracotta` | `#B5674D` | `oklch(52% 0.09 33)` | Primary CTA, Helper panel accent, borders, brand |
| `terracotta-hover` | `#9E553D` | `oklch(45% 0.09 33)` | Hover state for terracotta elements |
| `dustyblue` | `#5C7A8E` | `oklch(52% 0.06 225)` | Needer CTA, map markers, info badges |
| `dustyblue-hover` | `#4E6A7D` | `oklch(46% 0.06 225)` | Hover for dustyblue |
| `sage` | `#7A9B82` | `oklch(62% 0.05 150)` | Mental health module, success states |
| `sand` | `#C9A96E` | `oklch(72% 0.08 75)` | Warning, guidance, preparedness |
| `charcoal` | `#2C2824` | `oklch(18% 0.01 60)` | Primary text |
| `charcoal-light` | `#4A4540` | `oklch(30% 0.01 60)` | Secondary text |
| `charcoal-muted` | `#6B6560` | `oklch(44% 0.01 60)` | Placeholder, captions |
| `emergency` | `#C0392B` | `oklch(44% 0.18 25)` | Emergency indicators ONLY — never for decoration |

### Semantic Color Map
| Semantic Meaning | Token | Note |
|---|---|---|
| Primary action (helper) | `dustyblue` | Assign, action buttons in helper panel |
| Primary action (needer) | `terracotta` | Submit, request buttons in needer panel |
| Success / fulfilled | Emerald `#059669` | Fulfilled requests, verified status |
| Warning / pending | Amber `#D97706` | In-progress, review states |
| Danger / emergency | `emergency` `#C0392B` | Life-critical alerts only |
| Mental health calm | `sage` | Grounding, breathing, journal modules |
| Guidance / information | `sand` | SOP library, preparedness |

> ⚠️ **WCAG AA Contrast requirement:** All text must achieve ≥4.5:1 against its background.  
> Terracotta `#B5674D` on `surface` `#F5F0E8` = ~3.8:1 — **use only for large/bold text (≥18px or ≥14px bold)**.  
> For small body text use `charcoal` `#2C2824`.

---

## Typography

| Role | Size | Weight | Tailwind class |
|---|---|---|---|
| Page title | 24px | 900 (black) | `text-2xl font-black tracking-tight` |
| Section heading | 16px | 800 (extrabold) | `text-base font-extrabold` |
| Card title | 14px | 800 | `text-sm font-extrabold` |
| Label / overline | 11px | 700 (bold) | `text-[11px] font-bold uppercase tracking-wider` |
| Body | 13px | 500 | `text-xs font-medium` |
| Caption | 11px | 400 | `text-[11px] text-charcoal-muted` |
| Emergency text | 13–16px | 800 | High contrast, never obscured |

**Font stack:** `'Inter', system-ui, -apple-system, sans-serif`  
**Fallback:** system-ui ensures fast render on low-bandwidth disaster scenarios.

---

## Spacing & Layout

| Context | Value |
|---|---|
| Card internal padding | `p-5` (20px) or `p-6` (24px) |
| Section gap | `space-y-6` (24px) |
| Sidebar width | `w-64` (256px) desktop |
| Max content width | `max-w-7xl` |
| Touch target minimum | `min-h-[44px]` (WCAG 2.5.5) |
| Grid gutter | `gap-4` (16px) standard, `gap-3` (12px) compact |

---

## Neumorphic Shadow System

```css
/* Base card */
box-shadow: 5px 5px 12px #D6D0C5, -5px -5px 12px #FFFFFF;

/* Interactive hover lift */
box-shadow: 6px 6px 14px #CDC7BC, -6px -6px 14px #FFFFFF;

/* Inset / pressed */
box-shadow: inset 3px 3px 6px #D1CBC0, inset -3px -3px 6px #FFFFFF;

/* Button resting */
box-shadow: 3px 3px 8px #D4CEBF, -3px -3px 8px #FFFFFF;

/* Button active */
box-shadow: inset 2px 2px 5px #D1CBC0, inset -2px -2px 5px #FFFFFF;
```

**Rules:**
- Apply neumorphism to cards, nav items, form controls, toggles.
- Do NOT apply to emergency-status text or critical information — must remain flat and readable.
- Shadow offset direction: always top-left lighter, bottom-right darker (simulated light from top-left).

---

## Motion & Animation

| Interaction | Duration | Easing |
|---|---|---|
| Card hover lift | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Button active press | 150ms | `ease-in-out` |
| Skeleton shimmer | 1400ms | `ease-in-out` infinite |
| Breathing timer pulse | 4000ms inhale / 4000ms exhale | `ease-in-out` |
| Form error shake | 280ms | 5-keyframe multi-segment |
| Status badge transition | 200ms | default |
| Sidebar slide (mobile) | 220ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

**Always respect `prefers-reduced-motion`** — override all durations to 0.01ms.  
This is non-negotiable on a platform serving trauma and disaster-affected users.

---

## Component Patterns

### Cards
- `.neu-card` — base resting card
- `.neu-card-interactive` — hoverable, lifts on hover with `translateY(-2px)`
- `.neu-inset` — inset well (form fields, review boxes)
- `.neu-flat` — very subtle shadow for secondary surfaces

### Skeleton Loaders
- Use `.skeleton` class (shimmer background animation)
- Match the approximate height/shape of the content being loaded
- Example: `<div className="skeleton h-16 w-full" />`

### Step Indicators
- Use `.step-dot`, `.step-dot.active`, `.step-dot.done`
- Connect dots with horizontal `<span className="h-px flex-1 ..." />`

### Status Badges
- `<StatusBadge status={status} />` — handles all semantic colors
- Never use raw color classes for status — use the component

---

## Accessibility Tokens

| Requirement | Implementation |
|---|---|
| Focus visible | `2px solid terracotta, offset 2px` via `:focus-visible` |
| Skip link | `<a href="#main-content">Skip to main content</a>` — `.sr-only` normally, visible on focus |
| Screen-reader text | `.sr-only` utility class |
| Minimum touch target | `min-h-[44px] min-w-[44px]` on all interactive elements |
| Live regions | `aria-live="polite"` for status updates, `aria-live="assertive"` for errors |
| Icon-only buttons | Always include `aria-label` |
| Form controls | Always include `<label htmlFor={id}>` — never rely on placeholder alone |
| Modal dialogs | `role="dialog" aria-modal="true" aria-labelledby="..."` + Escape key close |
| Filter buttons | Use `aria-pressed` for toggle state |
| Loading states | `aria-busy="true"` on the container |

---

## Emergency UX Rules

1. Emergency phone numbers (112 national, 1078 NDRF) must appear in Mental Health module footer and sidebar.
2. Emergency-red `#C0392B` is reserved for life-critical information only.
3. The `animate-ping` dot indicates active disaster alert — use sparingly.
4. All emergency text must achieve ≥4.5:1 contrast regardless of theming.
5. Never hide or animate away primary emergency UI.

