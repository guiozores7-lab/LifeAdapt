'use strict';
// Read-only MCP stdio server. No network, credentials, device access or health records.
const readline=require('node:readline');
const fixtures=require('./mock-health-data.json');
const versions=['2025-03-26','2024-11-05'];
let initialized=false;
const tools=[
 {name:'list_mock_profiles',description:'List LifeAdapt fictional profiles. All data is simulated; no account access.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'get_mock_health_readings',description:'Read a fictional WHOOP or Apple Health example. Simplified fields, not a complete API response. Apple SDNN and WHOOP RMSSD HRV are distinct measures.',inputSchema:{type:'object',properties:{provider:{type:'string',enum:['whoop','apple-health']},persona:{type:'string',enum:['A','B','C']}},required:['provider','persona'],additionalProperties:false},annotations:{readOnlyHint:true}}
];
function handle(message){
 if(!message||typeof message!=='object'||Array.isArray(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string')return {jsonrpc:'2.0',id:message?.id??null,error:{code:-32600,message:'Invalid Request'}};
 if(message.id===undefined){if(message.method==='notifications/initialized')initialized=true;return null;}
 const reply=result=>({jsonrpc:'2.0',id:message.id,result});
 const error=(code,text)=>({jsonrpc:'2.0',id:message.id,error:{code,message:text}});
 if(message.method==='initialize')return reply({protocolVersion:versions.includes(message.params?.protocolVersion)?message.params.protocolVersion:versions[0],capabilities:{tools:{listChanged:false}},serverInfo:{name:'lifeadapt-health-mocks',version:'1.0.0'},instructions:fixtures.notice+' These tools do not modify the website or connect to WHOOP or Apple Health.'});
 if(message.method==='ping')return reply({});
 if(!initialized)return error(-32000,'Initialize the session first.');
 if(message.method==='tools/list')return reply({tools});
 if(message.method==='tools/call'){
  const args=message.params?.arguments||{},name=message.params?.name;
  let result;
  if(name==='list_mock_profiles'&&Object.keys(args).length===0)result={simulated:true,notice:fixtures.notice,profiles:Object.entries(fixtures.profiles).map(([persona,p])=>({persona,name:p.name,providers:['whoop','apple-health']}))};
  else if(name==='get_mock_health_readings'&&['whoop','apple-health'].includes(args.provider)&&['A','B','C'].includes(args.persona)&&Object.keys(args).every(k=>['provider','persona'].includes(k)))result={notice:fixtures.notice,persona:args.persona,name:fixtures.profiles[args.persona].name,readings:fixtures.profiles[args.persona][args.provider]};
  else return reply({isError:true,content:[{type:'text',text:'Unknown tool or invalid arguments. Use one listed tool and its declared arguments.'}]});
  return reply({content:[{type:'text',text:JSON.stringify(result)}]});
 }
 return error(-32601,'Method not found');
}
if(require.main===module){
 const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
 input.on('line',line=>{
  let result;
  try{result=handle(JSON.parse(line));}catch(error){result={jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}};}
  if(result)process.stdout.write(JSON.stringify(result)+'\n');
 });
}
module.exports={handle};
