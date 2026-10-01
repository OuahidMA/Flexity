# Flexboard Design System

## 1. Visual Theme & Atmosphere

Flexboard uses orange as its commanding brand color. The design operates on white backgrounds with Brand Orange (`#ea580c`, `#f97316`, `#9a3412`) creating a warm, energetic identity. IBM Plex Sans handles display headings with bold (700) weight and negative tracking while serving as the UI workhorse.

**Key Characteristics:**
- Brand Orange (`#ea580c`) as primary brand with darker variants (`#c2410c`, `#9a3412`)
- IBM Plex Sans (display) + IBM Plex Sans (UI) dual font system
- Near-black (`#101114`) text with cool blue-gray neutral scale
- 12px radius buttons (rounded but not pill)
- Subtle shadows (`rgba(0,0,0,0.03) 0px 4px 24px`) — whisper-level
- Green accent (`#149e61`) for positive/success states

## 2. Color Palette & Roles

### Primary
- **Brand Orange** (`#ea580c`): Primary CTA, brand accent, links
- **Orange Dark** (`#c2410c`): Button borders, outlined variants
- **Orange Deep** (`#9a3412`): Deepest orange
- **Orange Subtle** (`rgba(234,88,12,0.16)`): Orange at 16% — subtle button backgrounds
- **Near Black** (`#101114`): Primary text

### Neutral
- **Cool Gray** (`#686b82`): Primary neutral, borders at 24% opacity
- **Silver Blue** (`#9497a9`): Secondary text, muted elements
- **White** (`#ffffff`): Primary surface
- **Border Gray** (`#dedee5`): Divider borders

### Semantic
- **Green** (`#149e61`): Success/positive at 16% opacity for badges
- **Green Dark** (`#026b3f`): Badge text

## 3. Typography Rules

### Font Families
- **Display**: `IBM Plex Sans`, fallbacks: `IBM Plex Sans, Helvetica, Arial`
- **UI / Body**: `IBM Plex Sans`, fallbacks: `Helvetica Neue, Helvetica, Arial`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Display Hero | IBM Plex Sans | 48px | 700 | 1.17 | -1px |
| Section Heading | IBM Plex Sans | 36px | 700 | 1.22 | -0.5px |
| Sub-heading | IBM Plex Sans | 28px | 700 | 1.29 | -0.5px |
| Feature Title | IBM Plex Sans | 22px | 600 | 1.20 | normal |
| Body | IBM Plex Sans | 16px | 400 | 1.38 | normal |
| Body Medium | IBM Plex Sans | 16px | 500 | 1.38 | normal |
| Button | IBM Plex Sans | 16px | 500–600 | 1.38 | normal |
| Caption | IBM Plex Sans | 14px | 400–700 | 1.43–1.71 | normal |
| Small | IBM Plex Sans | 12px | 400–500 | 1.33 | normal |
| Micro | IBM Plex Sans | 7px | 500 | 1.00 | uppercase |

## 4. Component Stylings

### Buttons

**Primary Orange**
- Background: `#ea580c`
- Text: `#ffffff`
- Padding: 13px 16px
- Radius: 12px

**Orange Outlined**
- Background: `#ffffff`
- Text: `#c2410c`
- Border: `1px solid #c2410c`
- Radius: 12px

**Orange Subtle**
- Background: `rgba(234,88,12,0.16)`
- Text: `#c2410c`
- Padding: 8px
- Radius: 12px

**White Button**
- Background: `#ffffff`
- Text: `#101114`
- Radius: 10px
- Shadow: `rgba(0,0,0,0.03) 0px 4px 24px`

**Secondary Gray**
- Background: `rgba(148,151,169,0.08)`
- Text: `#101114`
- Radius: 12px

### Badges
- Success: `rgba(20,158,97,0.16)` bg, `#026b3f` text, 6px radius
- Neutral: `rgba(104,107,130,0.12)` bg, `#484b5e` text, 8px radius

## 5. Layout Principles

### Spacing: 1px, 2px, 3px, 4px, 5px, 6px, 8px, 10px, 12px, 13px, 15px, 16px, 20px, 24px, 25px
### Border Radius: 3px, 6px, 8px, 10px, 12px, 16px, 9999px, 50%

## 6. Depth & Elevation
- Subtle: `rgba(0,0,0,0.03) 0px 4px 24px`
- Micro: `rgba(16,24,40,0.04) 0px 1px 4px`

## 7. Do's and Don'ts

### Do
- Use Brand Orange (#ea580c) for CTAs and links
- Apply 12px radius on all buttons
- Use IBM Plex Sans for headings and body

### Don't
- Don't use pill buttons — 12px is the max radius for buttons
- Don't use colors outside the defined scale

## 8. Responsive Behavior
Breakpoints: 375px, 425px, 640px, 768px, 1024px, 1280px, 1536px

## 9. Agent Prompt Guide

### Quick Color Reference
- Brand: Brand Orange (`#ea580c`)
- Dark variant: `#c2410c`
- Text: Near Black (`#101114`)
- Secondary text: `#9497a9`
- Background: White (`#ffffff`)

### Example Component Prompts
- "Create hero: white background. IBM Plex Sans 48px weight 700, letter-spacing -1px. Orange CTA (#ea580c, 12px radius, 13px 16px padding)."
