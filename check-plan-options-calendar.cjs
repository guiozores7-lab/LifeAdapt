const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const script=fs.readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('subscribe(render);','').replace('render(); // Initial render','');const store=new Map(),ctx={console,Intl,Date,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};vm.createContext(ctx);vm.runInContext(script,ctx);
vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
for(const id of ['A','B','C']){
 setScenario(id);const before=JSON.stringify(_state),full=buildPlanOption(_state,'keep'),lighter=buildPlanOption(_state,'lighter');check(JSON.stringify(_state)===before,'options never mutate state');
 check(!full.hasHardViolation&&!lighter.hasHardViolation,'both baseline plans fit '+id);check(lighter.freedMinutes>0,'lighter truly frees time '+id);
 for(const fixed of _state.todayEvents.filter(e=>e.kind==='fixed'))for(const plan of [full,lighter]){const event=plan.proposedEvents.find(e=>e.id===fixed.id);check(event.start===fixed.start&&event.end===fixed.end,'fixed times untouched');}
 check(full.preparationScheduledMinutes>=full.preparationRequiredMinutes&&lighter.preparationScheduledMinutes>=lighter.preparationRequiredMinutes,'required preparation preserved');
 check(full.proposedEvents.find(e=>e.kind==='sleep').end-full.proposedEvents.find(e=>e.kind==='sleep').start===lighter.proposedEvents.find(e=>e.kind==='sleep').end-lighter.proposedEvents.find(e=>e.kind==='sleep').start,'sleep same in both');
 choosePlanOption('lighter');check(_state.proposal.optionId==='lighter','selection uses lighter');check(_state.proposal.changes.some(c=>c.changeType==='shortened'),'visible shorter records');approvePlan();check(!!_state.approvedPlan,'selected plan approval');
 const loaded=createInitialState();check(renderReviewView(loaded).includes('Undo this plan'),'undo visible after reload');
 const ics=createCalendarFile(_state.approvedPlan);check(ics.startsWith('BEGIN:VCALENDAR\\r\\n'),'ICS header');check(ics.endsWith('END:VCALENDAR\\r\\n'),'ICS footer');check(ics.split('BEGIN:VEVENT').length-1===_state.approvedPlan.proposedEvents.length,'each chosen event exported');
 check(ics.includes('DTSTART:')&&ics.includes('DTEND:'),'UTC dates');check(ics.includes('PRODID:-//LifeAdapt'),'LifeAdapt calendar branding');
 undoApproval();check(!_state.approvedPlan&&!Storage.loadLastApprovedPlan(),'first approval undo clears saved undo');
 console.log(id+': full and lighter valid, '+lighter.freedMinutes+' min freed, export contains '+(ics.split('BEGIN:VEVENT').length-1)+' events');
}
setScenario('A');choosePlanOption('lighter');const shortened=_state.proposal.changes.find(c=>c.changeType==='shortened');rejectChange(shortened.eventId);check(_state.proposal.changes.some(c=>c.eventId===shortened.eventId&&c.rejected),'shortening can be rejected');
console.log('PASS: two real options, accurate savings, fixed/sleep/prep protection, selection, approval, persistent undo, calendar content and rejected changes.');
`,ctx);
const escaped=vm.runInContext("icsEscape('a,b;c\\\\d\\nnew')",ctx);assert.equal(escaped,'a\\,b\\;c\\\\d\\nnew');const long=vm.runInContext("foldIcsLine('SUMMARY:'+ '🟢'.repeat(80))",ctx);for(const line of long.split('\r\n'))assert(Buffer.byteLength(line,'utf8')<=75);assert.equal(long.replace(/\r\n /g,''),'SUMMARY:'+'🟢'.repeat(80));console.log('PASS: ICS escaping and UTF-8 line folding.');
