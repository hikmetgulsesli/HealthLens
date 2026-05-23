# Design System: HealthLens

## 1. Visual Theme & Atmosphere

A clinical, trustworthy dark-mode interface designed for health tracking. The aesthetic is precise and premium — like a medical instrument app. Deep navy-charcoal backgrounds with a single teal accent create a focused, distraction-free environment. The interface feels weighty and deliberate, with generous spacing and clear hierarchy. Motion is fluid and purposeful, never playful.

- **Density:** 5/10 — Balanced, breathable layouts with clear information grouping
- **Variance:** 6/10 — Asymmetric layouts with intentional visual weight shifts
- **Motion:** 5/10 — Smooth spring physics for interactions, subtle shimmer for loading

## 2. Color Palette & Roles

### Primary Colors

- **Deep Navy** (#0F172A) — Primary background, canvas surface
- **Surface Dark** (#1E293B) — Cards, containers, elevated surfaces
- **Surface Light** (#334155) — Input backgrounds, secondary containers
- **Teal Accent** (#14B8A6) — Primary actions, active states, progress indicators, focus rings
- **Teal Light** (#5EEAD4) — Secondary accent, hover states, highlights

### Text Colors

- **Text Primary** (#F1F5F9) — Headlines, primary content, labels
- **Text Secondary** (#94A3B8) — Descriptions, metadata, placeholders
- **Text Muted** (#64748B) — Disabled states, tertiary information

### Semantic Colors

- **Success** (#22C55E) — Positive feedback, completed goals
- **Warning** (#F59E0B) — Caution states, pending items
- **Error** (#EF4444) — Destructive actions, validation errors
- **Error Surface** (#7F1D1D) — Error backgrounds, destructive button fills

### Border & Divider

- **Border Subtle** (rgba(148, 163, 184, 0.15)) — Card borders, dividers
- **Border Active** (rgba(20, 184, 166, 0.5)) — Focused inputs, active selections

## 3. Typography Rules

- **Display/Headlines:** HankenGrotesk-Bold — Tight tracking (-0.02em), weight-driven hierarchy
- **Body:** Inter-Medium — Relaxed leading (1.5), max 65ch width
- **Mono/Numbers:** Inter-Bold — For calorie counts, macro numbers, timestamps
- **Banned:** Generic system fonts for premium contexts. No serif fonts.

### Type Scale

- **H1 (Screen Title):** 28px, Bold, tracking-tight
- **H2 (Section Title):** 22px, Bold, tracking-tight
- **H3 (Card Title):** 18px, SemiBold
- **Body:** 16px, Medium, leading-relaxed
- **Caption:** 14px, Medium, secondary color
- **Label:** 12px, SemiBold, uppercase, tracking-wide, muted color

## 4. Component Stylings

### Buttons

- **Primary:** Teal accent fill (#14B8A6), white text, rounded-xl (16px), tactile -1px translate on active
- **Secondary:** Ghost/outline with border-subtle, teal text, same rounded corners
- **Destructive:** Error surface fill (#7F1D1D), error text, rounded-xl
- **Icon Button:** 48x48 minimum touch target, transparent background, icon in text-secondary

### Cards

- **Standard:** Surface dark fill (#1E293B), rounded-2xl (20px), border-subtle (1px), generous padding (20px)
- **Elevated:** Same as standard with subtle shadow (0 4px 20px rgba(0,0,0,0.3))
- **Active/Selected:** Border-active glow, slight teal tint on background

### Inputs

- **Text Input:** Surface light fill (#334155), rounded-lg (12px), border-subtle, teal focus ring
- **Label:** Above input, 12px uppercase, muted color
- **Placeholder:** Text muted color
- **Error State:** Error border, error text below input

### Sliders

- **Track:** Surface light background, 4px height, rounded-full
- **Fill:** Teal accent gradient
- **Thumb:** 20px circle, teal fill, subtle shadow

### Toggle/Switch

- **Track:** Surface light, 32px width, 20px height
- **Active:** Teal fill with white thumb
- **Inactive:** Surface dark with muted thumb

### Progress Rings

- **Track:** Surface dark, 12px stroke
- **Fill:** Teal accent gradient, rounded caps
- **Center Text:** Large mono numbers, label below

### Progress Bars

- **Track:** Surface dark, 8px height, rounded-full
- **Fill:** Teal accent, smooth width transition

## 5. Layout Principles

### Screen Structure

- **Safe Area:** Respect iOS safe areas (notch, home indicator)
- **Padding:** 20px horizontal margin on mobile
- **Section Spacing:** 24px between major sections
- **Card Spacing:** 16px between cards

### Grid System

- **Mobile:** Single column, full-width cards
- **Tablet:** 2-column grid for summary cards
- **Max Width:** 768px centered on larger screens

### Navigation

- **Bottom Tabs:** 3 tabs — Library (Camera/Gallery), Dashboard, Settings
- **Active Tab:** Teal accent icon + label, subtle background highlight
- **Inactive Tab:** Muted icon + label

## 6. Motion & Interaction

### Spring Physics

- **Default:** stiffness: 100, damping: 20 — premium, weighty feel
- **Quick:** stiffness: 200, damping: 15 — for micro-interactions
- **Smooth:** stiffness: 50, damping: 25 — for page transitions

### Micro-Interactions

- **Button Press:** Scale to 0.97, opacity to 0.9, spring back
- **Card Tap:** Subtle elevation increase, border glow
- **Progress Animation:** Smooth spring-based width/stroke transitions
- **List Items:** Staggered fade-in with 50ms delay between items

### Page Transitions

- **Modal (Review):** Slide from bottom, spring physics
- **Screen Push:** Standard iOS slide from right
- **Tab Switch:** Cross-fade with 150ms duration

## 7. Screen-Specific Designs

### Camera Capture Screen

- **Layout:** Full-screen camera preview (z-index: 1)
- **Overlay:** Dark gradient from top (for status bar) and bottom (for controls)
- **Reticle:** 280x280px centered square, 2px teal corners (L-shapes at each corner), no border
- **Status Pill:** Centered below reticle, "Align food in frame" with dot indicator
- **Top Bar:** Absolute positioned, transparent background, X (close) left, Settings right
- **Bottom Controls:** 3 buttons in row — Gallery (left), Capture (center, large), Flash (right)
- **Capture Button:** 72px circle, teal fill, white border, inner dot

### AI Review Screen

- **Layout:** ScrollView with sticky bottom summary bar
- **Image Card:** Full-width, 200px height, rounded-2xl, food photo
- **Match Badge:** Top-right of image, "98% Match" with check icon
- **Meal Category:** Horizontal scroll chips — Breakfast, Lunch, Dinner, Snack
- **Detected Items:** Cards with icon, name, portion slider, nutrition grid
- **Add Item Button:** Dashed border, teal text, "+ Add Item"
- **Bottom Bar:** Sticky, dark background, total nutrition summary + Save/Retake buttons

### Dashboard Screen

- **Layout:** ScrollView with FAB camera button
- **Header:** App name left, "Today" + calendar icon right
- **Calorie Ring:** 280px diameter, centered, large number in middle
- **Macro Bars:** 3 bars (Protein, Carbs, Fat) with current/goal labels
- **Today's Meals:** Card list with meal icon, name, time, calories
- **Empty State:** Plate illustration, "No meals logged yet" text, camera CTA
- **FAB:** 56px circle, teal fill, camera icon, bottom-right

### History Screen

- **Layout:** ScrollView with calendar picker at top
- **Calendar:** Horizontal scroll, 7 days, pill-shaped buttons, active day highlighted
- **Daily Summary:** 2x2 grid cards (Calories, Protein, Carbs, Fat)
- **Compare Goals:** Progress bars showing current vs goal
- **Today's Log:** Meal list with thumbnails, names, times, calories
- **7-Day Trend:** Bar chart with day labels

### Profile Settings Screen

- **Layout:** ScrollView with grouped sections
- **Header:** Back arrow left, "Profile" title center, Settings icon right
- **Page Title:** "Profile" large, subtitle below
- **Daily Targets:** Input fields for Calorie, Protein, Carbs, Fat goals
- **Micronutrient Tracking:** Toggle switches for Sodium, Fiber, Sugar
- **Preferences:** Unit preference selector
- **API Settings:** API Key input field (new section)
- **Data Actions:** Export Data (teal), Delete History (destructive)

## 8. Anti-Patterns (Banned)

- No emojis anywhere
- No generic system fonts (use HankenGrotesk + Inter)
- No pure black (#000000) — use Deep Navy (#0F172A)
- No neon/outer glow shadows
- No oversaturated accents (keep teal muted)
- No excessive gradient text
- No overlapping elements — clean spatial separation
- No 3-column equal card layouts
- No generic placeholder names
- No fake round numbers
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash")
- No filler UI text: "Scroll to explore", scroll arrows
- No horizontal scroll on mobile (except calendar picker)
- No broken image links
- No centered hero sections
- No playful/bouncy animations
