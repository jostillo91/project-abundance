/* Experiment 003: mixed crop allocation, transparent illustrative nutrient profile. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('./engine'):root.AbundanceEngine);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AbundanceMixed=api;})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
'use strict';
const PROTEIN_G_KG=Object.freeze({potatoes:20,wheat:130,beans:210}); // deliberately approximate food composition, not lab-calibrated
function simulateMixed(raw,allocations){
 const c=engine.sanitize({...raw,profile:'illustrative'});
 const keys=['potatoes','wheat','beans'];
 const weights=keys.map(k=>Math.max(0,Number.isFinite(+allocations?.[k])?+allocations[k]:0));
 const total=weights.reduce((a,b)=>a+b,0);
 const area=keys.map((k,i)=>total?c.hectares*weights[i]/total:0);
 const crops=keys.map((k,i)=>({key:k,hectares:area[i],spec:engine.CROPS[k]}));
 const irrigFactor=c.irrigation==='drip'?.76:1;
 const energyIrrFactor=c.irrigation==='drip'?1.17:1;
 const waterDemand=crops.reduce((n,x)=>n+x.hectares*x.spec.waterM3HaYr*irrigFactor,0);
 const energyDemand=crops.reduce((n,x)=>n+x.hectares*x.spec.energyKWhHaYr*energyIrrFactor,12500+c.robots*1800);
 const laborDemand=crops.reduce((n,x)=>n+x.hectares*x.spec.laborHoursHaYr,0);
 const availableWater=c.waterCapacityM3Day*365*(1-c.waterStressPct/100);
 const energySupply=c.solarKW*1750*(c.sunlightPct/100)*(c.reliabilityPct/100);
 const laborSupply=c.robots*2200*(c.reliabilityPct/100);
 const waterRatio=waterDemand?Math.min(1,availableWater/waterDemand):1;
 const energyRatio=energyDemand?Math.min(1,energySupply/energyDemand):1;
 const laborRatio=laborDemand?Math.min(1,laborSupply/laborDemand):1;
 const productionFactor=Math.pow(waterRatio,.75)*(.55+.45*energyRatio)*(.4+.6*laborRatio)*(1-c.foodWastePct/100);
 const harvest=crops.map(x=>({crop:x.key,hectares:x.hectares,edibleKg:x.hectares*x.spec.yieldKgHaYr*productionFactor,source:'illustrative'}));
 const calories=harvest.reduce((n,x)=>n+x.edibleKg*engine.CROPS[x.crop].caloriesPerKg,0);
 const proteinG=harvest.reduce((n,x)=>n+x.edibleKg*PROTEIN_G_KG[x.crop],0);
 const calorieNeed=c.population*2400*365;
 const proteinNeed=c.population*50*365; // research target, not individualized medical recommendation
 const capex=crops.reduce((n,x)=>n+x.hectares*x.spec.capexHa,0)+c.solarKW*1100+c.robots*32000+c.waterCapacityM3Day*750+c.storageDays*c.population*16;
 const opex=c.hectares*1800+c.robots*4500+c.solarKW*18+c.waterCapacityM3Day*365*.12;
 return {input:c,harvest,calories,proteinG,calorieCoveragePct:calories/calorieNeed*100,proteinCoveragePct:proteinG/proteinNeed*100,waterDemand,availableWater,energyDemand,energySupply,laborDemand,laborSupply,waterRatio,energyRatio,laborRatio,capex,annualizedCost:capex/15+opex,
  bottlenecks:[waterRatio<.98?'Water shortage':null,energyRatio<.98?'Energy shortage':null,laborRatio<.98?'Robot capacity shortage':null].filter(Boolean),
  assumptions:{proteinTargetGPersonDay:50,calorieTargetPersonDay:2400,proteinGKg:PROTEIN_G_KG,coefficients:'illustrative'},
  modelVersion:'0.4-mixed-illustrative',warning:'Protein and calories are only partial diet indicators. No vitamins, essential amino acid adequacy, dietary diversity, seasonal supply, food safety, or real-world feasibility is validated.'};
}
function searchMix(raw,{step=10}={}){
 const configs=[];
 for(let potato=0;potato<=100;potato+=step)for(let wheat=0;wheat<=100-potato;wheat+=step){
  const beans=100-potato-wheat;const mix={potatoes:potato,wheat,beans};const result=simulateMixed(raw,mix);
  if(result.calorieCoveragePct>=100&&result.proteinCoveragePct>=100)configs.push({mix,result});
 }
 configs.sort((a,b)=>a.result.annualizedCost-b.result.annualizedCost||a.result.waterDemand-b.result.waterDemand);
 return {tested:((100/step)+1)*((100/step)+2)/2,feasible:configs.length,top:configs.slice(0,5)};
}
return {PROTEIN_G_KG,simulateMixed,searchMix};
});