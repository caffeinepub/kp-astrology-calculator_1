# KP Astrology Calculator

## Current State
A KP astrology app with North Indian charts, Bhavchalit, Dasa panel, Nadi Numbers, Transit, Events (8 tables), and Horary tabs. Authorization component is now selected. Planet numbers in Nadi panel have various colors. Dasa shows Rahu starting 31-12-2013 (3 days early vs reference). No event dropdown on Horoscope tab. No user account save/load feature.

## Requested Changes (Diff)

### Add
- User account system: Login with Internet Identity. Logged-in users can save their current birth details (date, time, place, lat, lon) to backend and reload them on any device.
- Event selector dropdown in Horoscope tab above/below the Dasa panel: 24 events (Normal, Abortion, Aggression, Accident, Arrest, Award, Bail, Career, Change in Career, Child Birth, Cold Nature, Coming Home, Depression, Divorce, Education, Health, Litigation, Litigation Win, Love, Marriage, Property Purchase, Property Sale, Transfer, Travel, Vehicle Purchase, Vehicle Sale).
- When event selected: chart house numbers change color per event rules (see rules below). Also in all event analysis tables, planet/nakshatra/sublord numbers are colored per the selected event's rules.
- Event color rules applied to SVG chart house number labels and to numbers in event tables.

### Modify
- Dasa calculation: add +3 day empirical correction to all dasha start/end dates (to fix Rahu showing 31-12-2013 instead of 03-01-2014).
- Nadi Numbers panel: all house numbers displayed in black (remove color variations).
- NorthIndianChart component: accept optional `eventRule` prop. When provided, color each house number according to the rule instead of default gray.
- EventAnalysis component: accept optional `activeEventId` prop. When provided, color numbers in all tables according to that event's rules.

### Remove
- Nothing removed.

## Implementation Plan

### Backend (Motoko)
- Add `saveChart(data: Text) : async ()` - saves birth details JSON for authenticated caller
- Add `loadChart() : async ?Text` - returns saved chart data for authenticated caller
- Uses authorization mixin for identity-based storage (Map<Principal, Text>)

### Frontend
1. **Auth**: Add login/logout button (Internet Identity). Show saved chart load button when logged in.
2. **Dasa fix**: In kpEngine.ts `calculateDasha()`, add `DASHA_CORRECTION_MS = 3 * 24 * 60 * 60 * 1000` offset to all generated start/end dates.
3. **Nadi Numbers**: Change number color to `#000000` (black) for all displayed numbers.
4. **Event selector**: Add a `<select>` dropdown in the Horoscope tab (after charts, before Dasa panel). State: `activeEventId` (default 'normal').
5. **Chart coloring**: Pass `activeEventId` to NorthIndianChart. Map house numbers to colors based on event rules. Chart house number color: red/green/blue/orange/pink/default gray.
6. **Event tables coloring**: Pass `activeEventId` to EventAnalysis. In the event tables, color the numbers in planet/nak/sublord cells according to active event rules.

### Event Color Rules (for chart house numbers)
- Normal: all gray (no change)
- Abortion: 1,4,6,8,10,12=red; 2,5,9,11=green
- Aggression: 7,8,12=red; Mars planet=red
- Accident: 4,6,8,12=red
- Arrest: 2,3,8,12=red; Rahu,Ketu=red
- Award: 10,11=green; 6,8,12=red
- Bail: 10,11=green; 6,8,12=red
- Career: 10,11=green; 6,8,12=red
- Change in Career: 5,9=green; Sun,Rahu,Ketu,Saturn=green
- Child Birth: 2,5,11=green; 1,4,10=red; 6,8,12=orange
- Cold Nature: 2,5,9,11=green; 1,4,6,10=red
- Coming Home: 2,4,11=green
- Depression: 1,2,6,8=red
- Divorce: 1,6,8,10,12=red; 2,5,7,9,11=green
- Education: 6,8,12=red; 2,4,5,9,11=green
- Health: 5,9,11=green; 6,8,12=red
- Litigation: 6,8,12=red; 10,11=green
- Litigation Win: 6,8,12=red; 10,11=green
- Love: 5,8,12=green
- Marriage: 2,7,11=green; 1,6,10=red; 5,9=blue
- Property Purchase: 4,11=green; 6,8,12=pink
- Property Sale: 3,5,10=green; 11=blue
- Transfer: 3,9,12=green
- Travel: 3,9,12=green; Rahu,Ketu,Saturn,Sun=green
- Vehicle Purchase: 4,11=green; 6,8,12=pink; Venus=green
- Vehicle Sale: 3,5,10=green; Venus=green
