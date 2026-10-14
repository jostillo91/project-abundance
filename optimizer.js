
/* Project Abundance Experiment 002: reproducible, bounded design search.
   Works with the illustrative engine. NOT a validated farm design tool. */
(function(root,factory){
  const engine=typeof module!=='undefined' && module.exports ? require('./engine') : root.AbundanceEngine;
  const api=factory(engine);
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  root.AbundanceOptimizer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
  'use strict';
  const {simulate,DEFAULT,CROPS}=engine;
  const SCENARIOS=Object.freeze({
    baseline: {label:'Normal operations',stress:{waterStressPct:0,sunlightPct:100,reliabilityPct:95}},
    drought: {label:'65% water reduction',stress:{waterStressPct:65,sunlightPct:100,reliabilityPct:95}},
    lowSun: {label:'75% sunlight reduction',stress:{waterStressPct:0,sunlightPct:25,reliabilityPct:95}},
    breakdown: {label:'65% robot reliability loss',stress:{waterStressPct:0,sunlightPct:100,reliabilityPct:35}}
  });
  const finite=(v,fallback)=>Number.isFinite(+v)?+v:fallback;
  function optimize(raw={},options={}){
    const base=simulate({...DEFAULT,...raw}).input;
    const goal=options.goal==='water'?'water':options.goal==='land'?'land':'cost';
    const scenarioKey=SCENARIOS[options.scenario]?options.scenario:'baseline';
    const stress=SCENARIOS[scenarioKey].stress;
    const cap=Math.max(1,Math.min(25,Math.floor(finite(options.limit,5))));
    const maxHectares=Math.max(10,Math.min(600,finite(options.maxHectares,600)));
    const maxWater=Math.max(0,Math.min(6000,finite(options.maxWater,6000)));
    const maxSolar=Math.max(0,Math.min(3000,finite(options.maxSolar,3000)));
    const maxRobots=Math.max(0,Math.min(120,finite(options.maxRobots,120)));
    const target=base.population*2400*365;
    const tested=[];
    let evaluated=0,feasible=0;
    // Real discrete capacities are derived from each crop's requirements, then
    // stress-adjusted and scaled. This avoids cherry-picking only arbitrary
    // slider values and makes the search deterministic and reviewable.
    const landSteps=[];
    for(let land=10;land<=maxHectares;land+=10) landSteps.push(land);
    for(const cropKey of Object.keys(CROPS)){
      const crop=CROPS[cropKey];
      for(const irrigation of ['drip','flood']){
        for(const hectares of landSteps){
          const waterRequired=hectares*crop.waterM3HaYr*(irrigation==='drip'?.76:1);
          const usableWaterFrac=1-stress.waterStressPct/100;
          const reqWater=usableWaterFrac>0?waterRequired/(365*usableWaterFrac):Infinity;
          const laborRequired=hectares*crop.laborHoursHaYr;
          const reqRobots=laborRequired/(2200*(stress.reliabilityPct/100));
          for(const waterFactor of [0.8,1,1.2]){
            // For very small resource needs, allow zero only when justified.
            const waterCapacityM3Day=Math.ceil((reqWater*waterFactor)/10)*10;
            if(waterCapacityM3Day>maxWater)continue;
            for(const robotFactor of [0.8,1,1.25]){
              const robots=Math.ceil(reqRobots*robotFactor);
              if(robots>maxRobots)continue;
              const energyRequired=hectares*crop.energyKWhHaYr*(irrigation==='drip'?1.17:1)+robots*1800+12500;
              const sunFactor=(stress.sunlightPct/100)*(stress.reliabilityPct/100);
              const reqSolar=sunFactor>0?energyRequired/(1750*sunFactor):Infinity;
              for(const solarFactor of [0.8,1,1.25]){
                const solarKW=Math.ceil((reqSolar*solarFactor)/10)*10;
                if(solarKW>maxSolar)continue;
                const config={...base,crop:cropKey,irrigation,hectares,robots,solarKW,waterCapacityM3Day,...stress};
                const result=simulate(config);
                evaluated++;
                if(result.annualCalories+1e-5<target || result.waterRatio<0.98 || result.energyRatio<0.98 || result.laborRatio<0.98)continue;
                feasible++;
                const score=goal==='cost'?result.annualizedCost:goal==='water'?result.waterDemand:hectares;
                tested.push({config,result,score,scenario:scenarioKey});
              }
            }
          }
        }
      }
    }
    tested.sort((a,b)=>a.score-b.score || a.result.annualizedCost-b.result.annualizedCost || a.result.waterDemand-b.result.waterDemand || a.config.hectares-b.config.hectares || a.config.robots-b.config.robots);
    // Return distinct infrastructure designs. A design may be optimal for
    // one metric while dominated on another; expose tradeoffs rather than
    // labeling these as scientifically optimal.
    const seen=new Set(),recommendations=[];
    for(const candidate of tested){
      const key=[candidate.config.crop,candidate.config.irrigation,candidate.config.hectares,candidate.config.robots,candidate.config.solarKW,candidate.config.waterCapacityM3Day].join(':');
      if(seen.has(key))continue;
      seen.add(key);
      recommendations.push(candidate);
      if(recommendations.length>=cap)break;
    }
    return {goal,scenario:scenarioKey,evaluated,feasible,recommendations,modelVersion:'0.1-illustrative',method:'deterministic bounded grid search (10-hectare increments; derived water, robot and solar capacity)'};
  }
  return {optimize,SCENARIOS};
});

