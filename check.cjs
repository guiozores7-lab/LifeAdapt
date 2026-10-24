const fs=require('fs'),vm=require('vm');const html=fs.readFileSync('dist/index.html','utf8');const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('subscribe(render);','').replace('render(); // Initial render','');const data=new Map();const ctx={console,Intl,Date,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};vm.createContext(ctx);vm.runInContext(script,ctx);
vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
for(const id of ['A','B','C']){
 setScenario(id);const person=PERSONAS[id];
 check(_state.personaId===id,'person selected');check(_state.wearableContext.recoveryPercent===person.readings.recoveryPercent,'person readings');check(_state.constraints.importantEvent.title===person.importantEvent.title,'person goal');
 check(renderTodayView(_state).includes('Meet '+person.name),'visible person story');
 generatePlan();check(!_state.proposal.hasHardViolation,id+' baseline must fit');check(_state.proposal.proposedEvents.every(validEventTime),'valid intervals');
 console.log(id+': '+person.name+' / '+_state.wearableContext.recoveryPercent+'% / '+_state.constraints.importantEvent.title+' / '+_state.proposal.changes.length+' changes');
 approvePlan();check(!!_state.approvedPlan,'approval applies');const loaded=createInitialState();check(loaded.personaId===id&&!!loaded.approvedPlan,'reload retains matching person and approval');
 setDemoClock('08:00');check(!_state.proposal,'clock clears draft');check(!!_state.approvedPlan,'clock retains approval');
}
setScenario('A');addFixedMeeting(fixedActivity('test_meeting','Unexpected meeting',today(17,0),today(18,30)));check(_state.personaId==='A','meeting does not turn active regular into newcomer');generatePlan();check(_state.proposal.deferredTasks.some(d=>d.eventId==='a_workout'),'meeting leaves workout out');approvePlan();check(!_state.approvedPlan,'acknowledgement required');acknowledgeDeferred();approvePlan();check(!!_state.approvedPlan,'acknowledged approval');undoApproval();check(!_state.approvedPlan,'undo returns to original');
setScenario('B');check(_state.todayEvents.every(e=>e.id.startsWith('b_')),'no A events leak into B');check(_state.constraints.preference==='keep','new person resets choices');
setScenario('C');addFixedMeeting(fixedActivity('blocking','Late call',today(21,30),today(23,0)));generatePlan();check(_state.proposal.hasHardViolation,'sleep clash blocked');approvePlan();check(!_state.approvedPlan,'conflict cannot approve');
setScenario('A');_state.constraints.importantEvent.durationMinutes=-10;generatePlan();check(_state.proposal.hasHardViolation,'negative duration engine guard');approvePlan();check(!_state.approvedPlan,'negative duration cannot approve');
resetDemo();check(_state.personaId==='A'&&_state.wearableContext.recoveryPercent===82&&!_state.approvedPlan,'reset restores Maya');
console.log('PASS: three distinct people, matching reload state, no persona leaks, clock invalidation, meeting deferral, approval, undo, conflicts and duration guard.');
`,ctx);
