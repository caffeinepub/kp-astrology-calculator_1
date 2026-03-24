# KP Astrology Calculator

## Current State
- Single-page React app with a birth details form at top
- Below the form: Natal + Bhavchalit North Indian charts side by side
- Below charts: Dasha panel + Nadi Planet Numbers
- At bottom: 2-tab section for Planet Details table and House Cusps table
- NorthIndianChart uses a 5-row x 3-col grid; house sequence goes CLOCKWISE (H12 top-left → H1 top-center → H2 top-right → H3 right ... H11 left)
- kpEngine.ts has a `SUN_KP_OLD_CORRECTION = -2.0` empirical correction; Sun's nakshatra/sublord is computed AFTER this correction, placing it in Venus sublord zone
- No transit functionality exists

## Requested Changes (Diff)

### Add
- **3-tab page layout**: Replace the current single-scrolling-page with 3 top-level tabs:
  - Tab 1 "Horoscope": Form at top, then Natal + Bhavchalit charts side by side, then Dasa panel, then Nadi Planet Numbers
  - Tab 2 "Planets & Houses": Planet details table + House cusp degrees table (move existing bottom tabs here)
  - Tab 3 "Transit": Transit area with date picker and chart display
- **Transit tab (Tab 3)**:
  - Date input field (default = today's date)
  - Optional time input (default = 12:00)
  - "Calculate Transit" button
  - Shows two North Indian charts side by side: LEFT = Natal chart (from birth data, read-only, shows natal planets), RIGHT = Transit chart (shows transit planets for selected date placed by zodiac sign; the 12 houses/signs are arranged per the NATAL lagna to show direct house-to-house comparison)
  - Transit planets computed using same ayanamsa as selected for birth chart
  - When no birth chart is calculated yet, show a message prompting the user to calculate the birth chart first
  - `calculateTransitPlanetPositions(year, month, day, hour, min, lat, lon, tz, ayanamsa)` added to kpEngine.ts — same planet calculation logic as the birth chart but for the transit date; returns `ChartPlanet[]` array (no cusps needed unless birth location is used)
  - Transit chart header shows the selected transit date
- **Rahu/Ketu as Nakshatra lord or Sublord**: When `calculateNadiNumbers` encounters Rahu or Ketu as a planet's nak lord or sub lord, apply the same Nadi special logic (conjunctions, aspects, sign lord, bhavchalit position) to compute their house numbers instead of returning empty/zero

### Modify
- **House number direction — anticlockwise**: Fix `HOUSE_GRID` in `NorthIndianChart.tsx` so houses go COUNTER-CLOCKWISE starting from H1 at top-center going LEFT:
  ```
  New grid mapping (5-row × 3-col):
  [ H2 ][ H1 ][ H12 ]   ← top row
  [ H3 ][    ][ H11 ]   ← row 2
  [ H4 ][    ][ H10 ]   ← row 3
  [ H5 ][    ][  H9 ]   ← row 4
  [ H6 ][ H7 ][  H8 ]   ← bottom row
  ```
  H1=top-center, H2=top-left (first left from H1), then down the left column: H3, H4, H5, H6, across bottom: H7, up right column: H8, H9, H10, H11, H12=top-right
- **Sun sublord fix**: In `kpEngine.ts`, compute Sun's nakshatra lord and sublord using the UNCORRECTED sidereal longitude (before applying `SUN_KP_OLD_CORRECTION`). This way the display shows the corrected degree (~20°40') but the nakshatra/sublord are computed from the raw sidereal value (~22°40'), placing Sun in the Sun-sublord zone of Shravana nakshatra.

### Remove
- Bottom 2-tab section from the main page (moved into Tab 2)

## Implementation Plan
1. **kpEngine.ts**:
   - In the Sun planet calculation block, store both `sunSid` (corrected, for display) and `sunSidRaw` (uncorrected, for nak/sublord lookup). Use `sunSidRaw` when calling `getNakshatra()`, `getNakLord()`, `getSubLord()` for Sun.
   - Export new function `calculateTransitPlanetPositions(year, month, day, hour, min, lat, lon, tz, ayanamsaType)` that returns `ChartPlanet[]` — same planet position logic, just for a different date. Reuse existing helpers.
   - In `calculateNadiNumbers` (and `getNadiRowNumbers`/`getOwnedHouses`), when nak lord or sub lord is Rahu or Ketu, apply `getRahuKetuNadiNumbers()` logic instead of `getOwnedHouses()`.

2. **NorthIndianChart.tsx**:
   - Update `HOUSE_GRID` constant to the anticlockwise layout above.

3. **App.tsx**:
   - Wrap entire output in a 3-tab `<Tabs>` structure.
   - Tab 1: Move birth form + charts + dasha + nadi here.
   - Tab 2: Move existing planet/house tables here.
   - Tab 3: Add transit state (`transitDate`, `transitTime`, `transitPlanets`), date/time inputs, Calculate Transit button, and two side-by-side `NorthIndianChart` components (natal mode + transit mode). Transit chart uses natal cusps but shows transit planets. Pass `transitPlanets` to chart.
   - NorthIndianChart already supports `mode` prop; add `mode="transit"` or reuse `mode="natal"` with a `transitPlanets` override prop.
