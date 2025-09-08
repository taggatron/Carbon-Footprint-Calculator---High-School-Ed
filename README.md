# Simple Carbon Calculator (student version)

This is a small, single-page carbon footprint calculator designed for high school students. It reduces the number of questions to 10 while covering the main categories shown in the provided `Carbon footprint catergories.png`.

Files
- `index.html` — single-page UI
- `style.css` — styling
- `script.js` — calculation logic and simplified emission factors

How to run
1. Open `index.html` in any modern browser.

Design choices & assumptions
- Ten simplified inputs covering: electricity, heating, car use, flights (short/long), diet, consumer spending, recycling behaviour, and household size.
- Emission factors are rounded, student-friendly approximations. Units are tCO₂e (metric tonnes CO₂-equivalent).

New in this update
- Multi-step single-question screens: only one question group is shown at a time with Next/Back navigation and subtle animations.
- Styling: updated palette to dark green / light green / grey, modern rounded UI and progress bar.
- Screen-time conversion: we now ask about TV and phone hours/day and convert them into kWh/year using rough power draw estimates (TV ≈ 80W, phone ≈ 6W) then feed into electricity emissions.
 - Solar panels option: you can now enter an estimated percent of your home's electricity that is offset by solar (0–100%). The calculator reduces grid electricity emissions proportionally to that percent.
 - Solar panels: a simple Yes/No checkbox is provided. If you select 'Yes' the calculator assumes a Medium system (~2,500 kWh/year) and subtracts that amount from household electricity before computing emissions.
- Category badge: after calculation each student receives a badge:
	- A: Climate Villain (>10 tCO₂e/year)
	- B: Climate Consumer (5–10 tCO₂e/year)
	- C: Climate Friend (2–5 tCO₂e/year)
	- D: Climate Hero (<2 tCO₂e/year)

Key factors (source-like approximations)
- Electricity: 0.233 kgCO₂e/kWh (0.000233 tCO₂e/kWh) — global average grid intensity approximation.
- Natural gas heating: 0.185 kgCO₂e/kWh.
- Car: 0.271 kgCO₂e/mile for petrol (scaled for other fuels); electric car uses lower per-mile figure but still counts electricity.
- Flights: 0.15 tCO₂e per short-haul roundtrip, 0.6 tCO₂e per long-haul roundtrip (rounded averages).
- Diet: simplified annual footprints: omnivore 2.5 t, vegetarian 1.7 t, vegan 1.2 t (food only).
- Consumer spending: 0.0005 tCO₂e per USD of spending (rough economy-wide intensity for goods/clothing).
- Recycling: small negative adjustment per-person for good vs poor recycling.

Limitations
- This tool is intentionally simplified for classroom use. For personal decision-making or policy work, use a full-featured calculator with region-specific factors and more granular inputs.

Next steps / improvements
- Add localization for regional emission factors.
- Add per-question help text and classroom worksheets.
- Add export/print friendly summary for student projects.

License
Use freely for educational purposes.
