const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('subscribe(render);','').replace('render(); // Initial render','');
function contextFor(y,m,d,store=new Map()){
 const RealDate=Date;class DemoDate extends RealDate{constructor(...args){super(...(args.length?args:[y,m-1,d,12,0]));}static now(){return new DemoDate().getTime();}}
 const ctx={console,Intl,Date:DemoDate,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;
}
for(const [y,m,d] of [[2026,10,24],[2026,12,31],[2027,1,1],[2028,2,29],[2026,3,8],[2026,11,1]]){
 const ctx=contextFor(y,m,d);const out=vm.runInContext(`({year:new Date(_state.demoClockMs).getFullYear(),month:new Date(_state.demoClockMs).getMonth()+1,day:new Date(_state.demoClockMs).getDate(),hour:new Date(_state.demoClockMs).getHours(),nextDay:new Date(_state.constraints.importantEvent.start).getDate(),key:DEMO_DAY_KEY})`,ctx);
 assert.deepEqual([out.year,out.month,out.day,out.hour],[y,m,d,16]);assert.equal(out.nextDay,new Date(y,m-1,d+1).getDate());console.log('PASS date '+out.key);
}
const store=new Map();let first=contextFor(2026,12,31,store);vm.runInContext("setScenario('B');generatePlan();approvePlan();",first);let same=contextFor(2026,12,31,store);assert.equal(vm.runInContext('_state.personaId',same),'B');assert.equal(vm.runInContext('!!_state.approvedPlan',same),true);
let tomorrow=contextFor(2027,1,1,store);assert.equal(vm.runInContext('_state.personaId',tomorrow),'A');assert.equal(vm.runInContext('!!_state.approvedPlan',tomorrow),false);vm.runInContext("setView('protect')",tomorrow);assert.equal(vm.runInContext('!!createInitialState().approvedPlan',tomorrow),false);
vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
for(const [r,h,t] of [[82,8,'high'],[67,7,'high'],[66,8,'moderate'],[82,6,'moderate'],[40,8,'moderate'],[39,8,'low'],[82,5.9,'low']]){const a=wellnessAdvice(r,h);check(a.tier===t,'tier '+r+'/'+h);check(a.tips.length>=2&&a.tips.length<=3,'short recommendations');check(previewWhatIf(_state,r,h).tier===t,'advice and preview agree');}
for(const id of ['A','B','C']){setScenario(id);const p=personaFor(_state),r=p.readings.recoveryPercent,h=p.readings.sleepMinutes/60;check(renderTodayView(_state).includes(wellnessAdvice(r,h).tips[0]),'Today advice');generatePlan();check(renderReviewView(_state).includes(PROTECT_TOMORROW_TIPS[0]),'protect tomorrow advice');for(const change of _state.proposal.changes)check(renderChangeItem(change).includes('A small next step'),'decision advice');}
console.log('PASS: same-day restore, next-day reset, stale approval cleared, tier boundaries, advice alongside decisions.');
`,tomorrow);
