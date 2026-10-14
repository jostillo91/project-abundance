# Project Abundance — Experiments 001 & 002

A browser-playable **hybrid game + transparent simulation** for testing autonomous food production for a hypothetical 1,000-person arid-region community.

## Play now
Open `index.html` in any modern browser. **No server, account, installation, or internet connection is required.** Change resources and crop, select drought/low-sunlight/robot-failure scenarios, save up to 15 runs in the current session, compare them, and export experiment results to CSV.

## Architecture (MVP)

```text
User controls / isometric game scene (index.html)
                      |
                      v
       Pure simulation core (engine.js)
        crop configuration + constraints
        annual supply/demand/cost outputs
                      |
                      v
   KPI dashboard / warnings / experiment log
                      |
                      v
               CSV exports
```

The prototype includes the pure testable engine inline in `index.html` to make one-click offline play possible. `engine.js` contains the same underlying engine source, separately for future modularization. UI and core have no external dependencies. `engine.test.js` contains Node.js tests.

## Scientific approach

**IMPORTANT:** All numerical parameters are deliberately **illustrative placeholders**, NOT validated estimates for Arizona or any other location. In particular, crop yields, irrigation volumes, energy rates, robot productivity, equipment costs, and the loss/shortage response curves are fictional scenario coefficients inspired by plausible dimensional scales, **not empirical forecasts**. This simulator cannot establish feasibility for a real farm, food system or investment. It treats food only as annual energy (calories) and omits nutrition diversity, seasonality, water rights, soil conditions, transport, crop cycles, land prices, human oversight, supply chains, ecological impacts and operations risk.

### What is calculated

- Annual baseline crop harvest: hectares × illustrative crop yield kg/ha/year.
- Yearly irrigation demand: hectares × crop-specific cubic meters/ha/year × irrigation factor (drip uses an *assumed* 0.76 multiplier).
- Water capacity: cubic meters/day × 365 × (1 − scenario water stress).
- Water-limited yield factor: min(1, supply / demand)^0.75.
- Electricity supply: solar kW × 1,750 kWh/kW/year × sunlight factor × equipment reliability.
- Annual power demand: farm area needs (crop-dependent), robots and fixed overhead. Power-limited yield factor: 0.55 + 0.45 × min(1, supply / demand).
- Robot labor capacity: number of robots × 2,200 hours/year × reliability. Labor-limited yield factor: 0.4 + 0.6 × min(1, capacity / demand).
- Calories after loss: crop kg × illustrative calories/kg × (1 − post-harvest loss).
- Community calories: people × 2,400 kcal/day × 365 days.
- Annualized cost: assumed initial capital/15 years + annual operating costs. Per-covered-person/day denominator is **people whose annual calories are covered, capped at community size**.

Shortfall response curves currently allow some production without full electricity/robot labor as a simplification; no water means no production. Water and labor metrics are capacity-to-demand ratios, not literal utilization measures.

## Development

```bash
node --test engine.test.js
```

## Next milestones

1. **Calibration:** replace placeholder crop yields and irrigation water values with documented region-appropriate primary sources (USDA NASS, USDA ERS, FAO AQUASTAT; Arizona water agency), keeping versioned data and units.
2. **Food realism:** mixed cropping, nutrition targets, seasonality and population-specific diets.
3. **Operations realism:** hourly weather and energy production; equipment downtime, storage and irrigation constraints; uncertainty intervals.
4. **Research mode:** parametric sweeps, sensitivity analysis, calibrated baselines, reproducibility manifests and scenario comparison.
5. **Game expansion:** unlockable infrastructure, multi-region scenarios, 2D/isometric map editing and eventually multi-agent optimization.

## Vision

Reduce the cost and resource intensity of universal food, clean water, energy and shelter. Game engagement motivates experimentation; validation and transparent model assumptions are what determine whether findings have real-world utility.


## Experiment 002 — Automatic Farm Designer (v0.2)

The browser now includes **Find better farm designs**. Select annualized cost, irrigation water demand, or land area as the optimization objective; choose a required stress case (normal, drought, low sunlight, or robot breakdown); and search the bounded configuration grid. The app evaluates thousands of discrete crop, land, irrigation, water, solar, and robot combinations. It only recommends designs that clear 100% of annual modeled calorie demand and at least 98% of required modeled water, energy, and robotic labor. Load any recommendation back into the main game to inspect it. It reports the number of designs searched and how many passed all constraints.

The search is **deterministic exhaustive grid search over a defined candidate set**, not a trained AI agent, a continuous global optimizer, or proof of optimality outside the candidate grid. Results remain illustrative because the underlying engine's numeric coefficients are placeholders. Stress cases are each tested separately, not simultaneously. There is no requirement that the design has a varied, nutritionally complete diet.

Run both sets of Node tests with `node --test engine.test.js optimizer.test.js`.

Files: `optimizer.js` (modular algorithm) and `optimizer.test.js` (verification). The standalone HTML embeds its own copy of `optimizer.js` alongside `engine.js` to support offline use. Keep copies in sync when editing them.

## Experiment 003 — Arizona durum wheat observational anchors (v0.3)

The **Model dataset** dropdown switches between the original hypothetical coefficients and an Arizona wheat observational profile. This is a *partial calibration*, not validation of the entire autonomous farming simulation.

**Documented input measurements**:
- Wheat yield: USDA NASS Arizona 2024 state overview, **durum wheat 109 bushels/acre**. Converted with standard **60 lb/bushel** wheat test weight and exact SI conversions to about **7,330 kg/hectare**. Source: https://www.nass.usda.gov/Quick_Stats/Ag_Overview/stateOverview.php?state=Arizona&year=2024
- Applied irrigation: University of Arizona Cooperative Extension, **2023 wheat average of 3.4 acre-feet per acre**. Converted to approximately **10,365 m³/hectare**. Source: https://www.extension.arizona.edu/publication/water-sustainability-indicators-arizonas-small-grains-industry

**Caveats**: These measurements refer to different years and farm populations; they are not a matched trial. The USDA figure is observed farm production, not an autonomous-robot farm outcome. Applied irrigation is not crop evapotranspiration. No regional potato or bean measurements are implied: the calibrated profile uses wheat only. The measured water rate is applied as-is for either irrigation option because a defensible method-specific effect is not yet established. The remaining labor, energy, economic, calorie, stress response and reliability coefficients remain *illustrative*. The optimizer operates over hypothetical capacity configurations using these limited observed anchors, not a proven engineering design.

Run `node --test engine.test.js optimizer.test.js calibration.test.js`.