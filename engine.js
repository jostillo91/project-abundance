/* Project Abundance MVP simulation engine. All coefficients are ILLUSTRATIVE,
   not calibrated agronomic or engineering predictions. Pure/deterministic. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AbundanceEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CROPS = Object.freeze({
    potatoes: { label: 'Potatoes', caloriesPerKg: 770, yieldKgHaYr: 26000, waterM3HaYr: 4200, energyKWhHaYr: 1400, laborHoursHaYr: 280, capexHa: 13500, color: '#eeb76b' },
    wheat: { label: 'Wheat', caloriesPerKg: 3400, yieldKgHaYr: 4200, waterM3HaYr: 3800, energyKWhHaYr: 900, laborHoursHaYr: 115, capexHa: 9200, color: '#f2d684' },
    beans: { label: 'Beans', caloriesPerKg: 3300, yieldKgHaYr: 2200, waterM3HaYr: 3100, energyKWhHaYr: 1200, laborHoursHaYr: 190, capexHa: 11400, color: '#b7daab' }
  });
  // Observational anchors, not a complete autonomous-farm calibration.
  // USDA NASS 2024 AZ durum wheat: 109 bu/acre; 60 lb/bu standard wheat test weight.
  // UA Extension: 2023 AZ wheat irrigation applied = 3.4 acre-feet/acre.
  const AZ_WHEAT = Object.freeze({
    label:'Arizona durum wheat (observed anchors)',
    yieldKgHaYr: 109 * 60 * 0.45359237 / 0.40468564224,
    waterM3HaYr: 3.4 * 1233.48183755 / 0.40468564224,
    yieldSource:'https://www.nass.usda.gov/Quick_Stats/Ag_Overview/stateOverview.php?state=Arizona&year=2024',
    waterSource:'https://www.extension.arizona.edu/publication/water-sustainability-indicators-arizonas-small-grains-industry',
    yieldYear:2024, waterYear:2023
  });
  const DEFAULT = Object.freeze({ profile: 'illustrative', population: 1000, hectares: 50, crop: 'potatoes', irrigation: 'drip', solarKW: 500, robots: 8, waterCapacityM3Day: 2700, storageDays: 3, foodWastePct: 15, waterStressPct: 0, sunlightPct: 100, reliabilityPct: 95, year: 1 });
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, Number.isFinite(+v) ? +v : lo)); }
  function sanitize(raw = {}) {
    const c = { ...DEFAULT, ...raw };
    c.profile = c.profile === 'az-wheat' ? 'az-wheat' : 'illustrative';
    if (c.profile === 'az-wheat') c.crop = 'wheat';
    c.population = clamp(c.population, 1, 100000);
    c.hectares = clamp(c.hectares, 0, 10000);
    c.crop = CROPS[c.crop] ? c.crop : DEFAULT.crop;
    c.irrigation = c.irrigation === 'flood' ? 'flood' : 'drip';
    c.solarKW = clamp(c.solarKW, 0, 100000);
    c.robots = clamp(c.robots, 0, 10000);
    c.waterCapacityM3Day = clamp(c.waterCapacityM3Day, 0, 1000000);
    c.storageDays = clamp(c.storageDays, 0, 365);
    c.foodWastePct = clamp(c.foodWastePct, 0, 95);
    c.waterStressPct = clamp(c.waterStressPct, 0, 100);
    c.sunlightPct = clamp(c.sunlightPct, 0, 150);
    c.reliabilityPct = clamp(c.reliabilityPct, 0, 100);
    return c;
  }
  function simulate(raw) {
    const c = sanitize(raw), crop = c.profile === 'az-wheat' ? {...CROPS.wheat,...AZ_WHEAT} : CROPS[c.crop];
    const irrigationMultiplier = c.profile === 'az-wheat' ? 1 : (c.irrigation === 'drip' ? .76 : 1);
    const energyIrrigationFactor = c.irrigation === 'drip' ? 1.17 : 1;
    const waterDemand = c.hectares * crop.waterM3HaYr * irrigationMultiplier;
    const availableWater = c.waterCapacityM3Day * 365 * (1 - c.waterStressPct / 100);
    const waterRatio = waterDemand === 0 ? 1 : Math.min(1, availableWater / waterDemand);
    const waterYieldFactor = Math.pow(waterRatio, .75);
    const energyDemand = c.hectares * crop.energyKWhHaYr * energyIrrigationFactor + c.robots * 1800 + 12500;
    const energySupply = c.solarKW * 1750 * (c.sunlightPct / 100) * (c.reliabilityPct / 100);
    const energyRatio = energyDemand === 0 ? 1 : Math.min(1, energySupply / energyDemand);
    const energyYieldFactor = .55 + .45 * energyRatio;
    const laborDemand = c.hectares * crop.laborHoursHaYr;
    const robotLaborCapacity = c.robots * 2200 * (c.reliabilityPct / 100);
    const laborRatio = laborDemand === 0 ? 1 : Math.min(1, robotLaborCapacity / laborDemand);
    const laborYieldFactor = .4 + .6 * laborRatio;
    const kgHarvest = c.hectares * crop.yieldKgHaYr * waterYieldFactor * energyYieldFactor * laborYieldFactor;
    const annualCalories = kgHarvest * crop.caloriesPerKg * (1 - c.foodWastePct / 100);
    const neededCalories = c.population * 2400 * 365;
    const nutritionCoverage = neededCalories > 0 ? annualCalories / neededCalories : 0;
    const peopleFed = Math.min(c.population, Math.floor(annualCalories / (2400 * 365)));
    const capex = c.hectares * crop.capexHa + c.solarKW * 1100 + c.robots * 32000 + c.waterCapacityM3Day * 750 + c.storageDays * c.population * 16;
    const operatingCostYr = c.hectares * 1800 + c.robots * 4500 + c.solarKW * 18 + c.waterCapacityM3Day * 365 * .12;
    const annualizedCost = capex / 15 + operatingCostYr;
    const costPerCoveredPersonDay = peopleFed ? annualizedCost / peopleFed / 365 : null;
    const warnings = [];
    if (waterRatio < .98) warnings.push('Water supply constrains harvest');
    if (energyRatio < .98) warnings.push('Electricity supply constrains operations');
    if (laborRatio < .98) warnings.push('Robot labor constrains harvest');
    if (nutritionCoverage < 1) warnings.push('Annual calories fall short of demand');
    if (c.profile === 'az-wheat') warnings.push('Observed wheat anchors only; robot, power, loss response, and costs remain hypothetical; irrigation-method gains not calibrated');
    if (warnings.length === 0) warnings.push('No modeled bottleneck detected');
    return {
      input: c, peopleFed, coveragePct: nutritionCoverage * 100, kgHarvest, annualCalories, neededCalories,
      waterDemand, availableWater, waterRatio, energyDemand, energySupply, energyRatio,
      laborDemand, robotLaborCapacity, laborRatio, capex, operatingCostYr, annualizedCost,
      costPerCoveredPersonDay, warnings,
      modelVersion: c.profile === 'az-wheat' ? '0.3-az-wheat-observations' : '0.1-illustrative',
      evidence: c.profile === 'az-wheat' ? AZ_WHEAT : null,
      assumptions: {kcalPerPersonDay:2400, solarKWhPerKWYear:1750, robotHoursPerYear:2200, yearsCapexAmortization:15}
    };
  }
  function sweep(raw, key, values) { return values.map(value => ({value, result:simulate({...raw,[key]:value})})); }
  return { CROPS, AZ_WHEAT, DEFAULT, sanitize, simulate, sweep };
});
