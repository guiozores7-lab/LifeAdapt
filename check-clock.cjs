const fs=require('fs'),vm=require('vm');const script=fs.readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('subscribe(render);','').replace('render(); // Initial render','');const ctx={console,Intl,Date,localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}};vm.createContext(ctx);vm.runInContext(script,ctx);vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
setScenario('A');const classes=_state.todayEvents.find(e=>e.id==='a_classes'),lab=_state.todayEvents.find(e=>e.id==='a_lab');
for(const [time,expected] of [['08:00',['Upcoming','Upcoming']],['10:00',['In progress','Upcoming']],['12:01',['Completed','Upcoming']],['14:00',['Completed','In progress']],['15:01',['Completed','Completed']],['16:00',['Completed','Completed']],['08:00',['Upcoming','Upcoming']]]){setDemoClock(time);check(JSON.stringify([eventPhase(classes,_state.demoClockMs),eventPhase(lab,_state.demoClockMs)])===JSON.stringify(expected),'clock '+time);}
console.log('PASS: clock statuses, exact end-time rule, reverse scrubbing, person preserved.');
`,ctx);
