# REVERSE PROMPT — AI Renovation Estimator (Lead Portal)

Use this prompt to recreate or modify the AI Renovation Estimator tool.

---

## PROMPT

Build an AI Renovation Estimation tool for a lead generation portal as a single-page web application (HTML + CSS + JS, no frameworks). The tool is a 6-step wizard that collects renovation requirements, shows a cost estimate, and captures leads.

The design language should be premium and clean — warm neutrals, gold accent (#c9a96e), soft shadows, rounded cards, smooth step transitions with fade-in animation. Fully responsive for mobile/tablet/desktop.

---

### STEP 1 — Property Type Selection

Display 6 clickable icon-buttons in a 3-column grid. Each button has an SVG icon and label. Only one can be selected at a time (radio behavior). Highlight selected button with gold border and soft gradient background.

Options:
1. BTO / SBF (new flat icon with "NEW" label)
2. >20 Years Old Resale HDB (aged building icon)
3. MOP Resale HDB (mid-age building icon)
4. Condominium (twin tower icon)
5. Landed (house with roof icon)
6. Commercial (office building icon)

Each property type has a cost multiplier applied to the final estimate:
- BTO/SBF: 1.0x
- >20 Years Resale HDB: 1.25x
- MOP Resale HDB: 1.1x
- Condominium: 1.35x
- Landed: 1.6x
- Commercial: 1.5x

The "Next" button is disabled until a property type is selected.

---

### STEP 2 — Scope of Works (Multi-select Checkboxes)

Display categorised checkbox items. Users can select multiple items across all categories. Each item has a hidden base cost (in SGD). Custom-styled checkboxes with gold check animation.

**Hacking & Dismantling** (wrench icon)
- Hack whole house flooring and wall tiles — $5,000
- Hack kitchen and bathrooms only — $3,000
- Dismantle 1-3 sets of cabinets — $800
- Dismantle 4-8 sets of cabinets — $1,800
- Demolish 1FT-5FT of wall — $1,200
- Demolish 6FT-10FT of wall — $2,200
- Demolish 11FT-15FT of wall — $3,200

**Carpentry** (cabinet icon)
- 20FT-30FT of kitchen cabinet — $8,000
- 31FT-40FT of kitchen cabinet — $12,000
- 1-2 sets of full-height wardrobe — $5,000
- 3-4 sets of full-height wardrobe — $9,000
- 1-2 sets of other cabinetry — $3,500
- 3-4 sets of other cabinetry — $6,500

**Electrical** (lightning bolt icon)
- Minor electrical works — $2,500
- Rewiring needed — $6,000

**Plumbing** (pipe icon)
- Minor plumbing works — $1,500
- Re-lay whole house water pipes — $4,500
- Relocate discharge pipes — $2,500

**Other Works** (general icon)
- Painting — $2,800
- Haulage & disposal of debris — $1,500
- General cleaning — $500

The "Next" button is disabled until at least one scope item is selected.

---

### STEP 3 — Design Style Selection (Pick up to 3)

Display 9 style cards in a 3-column grid. Each card has a visual preview (CSS-only room mockup using colored divs for wall, floor, furniture shapes — no images needed) and a label. Users can select up to 3. Show a counter "Selected: X / 3". When 3 are selected, disable remaining unselected cards (greyed out). Clicking a selected card deselects it.

Styles with their color palettes:
1. **Scandinavian** — light wood tones, soft whites, pale blue accents
2. **Muji** — warm beige, natural wood, cream whites
3. **Wabi Sabi** — earthy browns, stone grey, organic textures
4. **Modern Lux** — dark navy/charcoal, gold metallic accents
5. **Minimalist** — pure whites, light greys, no clutter
6. **Contemporary** — mixed neutrals, forest green, burnt orange pops
7. **Elegant** — warm gold, dark wood, ornate shapes
8. **Industrial** — dark grey, exposed brick brown, orange Edison bulb accent
9. **Japandi** — black + light wood, minimal plant green

Each selected style adds a $1,500 design consultation fee to the final estimate.

The "Next" button is disabled until at least one style is selected.

---

### STEP 4 — Floor Plan Upload (Optional)

Display a drag-and-drop upload area with:
- Upload icon (arrow up)
- "Drag & drop your floor plan here"
- "or click to browse (JPG, PNG, PDF - max 10MB)"
- Hidden file input triggered on click

On file selection:
- Validate file size (max 10MB), alert if exceeded
- Hide the upload area, show a green success preview with filename and a remove (×) button
- Clicking remove resets back to the upload area

This step is optional — the "Next" button is always enabled.

---

### STEP 5 — Contact Information

Collect 3 required fields:
1. **Full Name** — text input
2. **Email Address** — email input with regex validation (`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
3. **WhatsApp Number** — tel input with "+65" country code prefix displayed as a static badge, validates 8 digits only (`^[0-9]{8}$`)

Show red border on invalid fields. Live validation on input (remove error state as user types). The button text changes to "Get My Estimate" on this step (no arrow icon). Button is disabled until all 3 fields have values.

---

### STEP 6 — Results & Estimate Display

Generate and display the cost breakdown:

**Summary cards** (2-column grid):
- Property Type selected
- Design Styles selected (comma-separated)

**Cost Breakdown table** grouped by category:
- For each selected scope item: multiply base cost × property multiplier, then apply ±10% random variance (rounded to nearest $50) for realism
- Add "Design & Consultation" row: $1,500 × number of styles selected

**Total cost** displayed prominently in a dark banner with gold text.

**Disclaimer**: "This is a rough provisional estimate. Final costs may vary based on site conditions, material selections, and detailed requirements."

**Free Gift CTA Banner** with pulsing gold border animation:
- Gift box icon
- "Claim Your Free Gift!"
- "Book a consultation appointment today and receive an exclusive renovation starter pack worth $288!"
- "Book Now & Claim Gift" button

**Appointment Booking Modal** (triggered by the CTA button):
- Date picker (min = today)
- Time selector dropdown: 10AM, 11AM, 12PM, 2PM, 3PM, 4PM, 5PM, 6PM, 7PM
- "Confirm Appointment" button
- On confirm: hide form fields, show success state with green checkmark: "Appointment Confirmed! We'll WhatsApp you a confirmation shortly."
- Modal closes on clicking × or clicking the overlay

Hide the "Next" button on this final step. The "Back" button remains visible.

---

### NAVIGATION & PROGRESS BAR

- 6 step dots connected by a horizontal line
- Current step dot: gold border
- Completed step dots: solid gold fill with white number
- Progress line fills proportionally as steps advance
- "Back" button hidden on step 1, visible on steps 2-6
- "Next" button disabled when step requirements not met
- Smooth scroll to top on each step transition

---

### TECHNICAL REQUIREMENTS

- Pure HTML + CSS + JS (no dependencies, no build tools)
- All CSS scoped to avoid conflicts when embedded in WordPress or other CMS
- All styles use CSS custom properties for easy theming
- Mobile-responsive with breakpoints at 768px and 480px
- SVG icons inline (no external icon libraries)
- Design style previews are pure CSS (colored divs), not images
- Form validation is client-side only
- Currency is Singapore Dollars (SGD), displayed with $ prefix and comma thousands separator

---

### COLOR SYSTEM

- Primary: #2c2c2c (dark text, dark backgrounds)
- Accent: #c9a96e (gold — buttons, highlights, selected states)
- Accent Light: #e8d5a8 (hover states, soft highlights)
- Accent Dark: #a8893e (active/pressed states)
- Background: #faf9f6 (warm off-white page bg)
- Card Background: #ffffff
- Border: #e5e5e5
- Text Light: #777 (subtitles, secondary text)
- Success: #4CAF50 (upload confirmation, appointment success)
