'use strict';
const crypto = require('node:crypto');
const API = 'https://api.prod.whoop.com';
const SESSION = '__Host-lifeadapt-whoop';
const FLOW = '__Host-lifeadapt-whoop-flow';
const BASE = '/.netlify/functions/whoop/';
const security = {'Cache-Control':'no-store, private','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function config(env=process.env) {
 try {
  const origin = new URL(env.APP_ORIGIN).origin;
  if (!env.WHOOP_CLIENT_ID || !env.WHOOP_CLIENT_SECRET || !/^[a-f\d]{64}$/i.test(env.WHOOP_SESSION_KEY||'') || !origin.startsWith('https://') || new URL(env.APP_ORIGIN).href !== origin+'/') return null;
  return {origin,id:env.WHOOP_CLIENT_ID,secret:env.WHOOP_CLIENT_SECRET,key:Buffer.from(env.WHOOP_SESSION_KEY,'hex'),callback:origin+BASE+'callback'};
 } catch {return null;}
}
function seal(data,key){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const body=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');}
function unseal(value,key,kind){try{const b=Buffer.from(value||'','base64url');const decipher=crypto.createDecipheriv('aes-256-gcm',key,b.subarray(0,12));decipher.setAuthTag(b.subarray(12,28));const result=JSON.parse(Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString());return result.kind===kind&&result.exp>Date.now()?result:null;}catch{return null;}}
function cookie(name,value,seconds){if(value.length>3700)throw Error('session-size');return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0,Math.floor(seconds))}`;}
function cookies(event){return Object.fromEntries((event.headers.cookie||'').split(';').map(v=>v.trim().split(/=(.*)/s)).filter(p=>p[0]));}
function json(statusCode,data,extra={}){return {statusCode,headers:{...security,'Content-Type':'application/json',...extra},body:JSON.stringify(data)};}
function redirect(location,setCookies=[]){return {statusCode:302,headers:{...security,Location:location},multiValueHeaders:{'Set-Cookie':setCookies},body:''};}
async function upstream(url,options={}){return fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(8000)});}
class ApiError extends Error{constructor(status){super('WHOOP request failed');this.status=status;}}
async function whoopJson(path,token){const response=await upstream(API+'/developer/v2/'+path,{headers:{Authorization:'Bearer '+token}});if(!response.ok)throw new ApiError(response.status);return response.json();}
function normalizeReadings(recovery,sleep,now=Date.now()){
 const score=recovery?.score?.recovery_score,stages=sleep?.score?.stage_summary;
 const amounts=['total_light_sleep_time_milli','total_slow_wave_sleep_time_milli','total_rem_sleep_time_milli'].map(k=>stages?.[k]);
 const ended=Date.parse(sleep?.end);
 if(recovery?.score_state!=='SCORED'||sleep?.score_state!=='SCORED'||sleep.nap||recovery.sleep_id!==sleep.id||recovery.cycle_id!==sleep.cycle_id||!Number.isFinite(score)||score<0||score>100||amounts.some(v=>!Number.isFinite(v)||v<0)||!Number.isFinite(ended)||ended>now+300000||now-ended>36*3600000)return null;
 const sleepMinutes=Math.round(amounts.reduce((a,b)=>a+b,0)/60000);
 if(sleepMinutes<=0||sleepMinutes>24*60)return null;
 return {source:'whoop',recoveryPercent:score,sleepMinutes,sleepEndedAt:sleep.end,recoveryUpdatedAt:recovery.updated_at,importedAt:new Date(now).toISOString(),date:sleep.end.slice(0,10)};
}
async function latestReadings(token){
 // The collection is newest sleep first. Never substitute an older score for an unscored current recovery.
 const page=await whoopJson('recovery?limit=1',token),recovery=page.records?.[0];
 if(!recovery||recovery.score_state!=='SCORED'||!recovery.sleep_id)return null;
 const sleep=await whoopJson('activity/sleep/'+encodeURIComponent(recovery.sleep_id),token);
 return normalizeReadings(recovery,sleep);
}
async function handler(event){
 const headers=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),v]));event={...event,headers};
 const route=(event.path||'').startsWith(BASE)?event.path.slice(BASE.length):'';
 const method=event.httpMethod,cfg=config(),jar=cookies(event);
 if(route==='status'&&method==='GET')return json(200,{configured:!!cfg,connected:!!(cfg&&unseal(jar[SESSION],cfg.key,'session'))});
 if(!cfg)return json(503,{error:'not_configured',message:'WHOOP connection is not enabled on this deployment. Demo readings still work.'});
 const session=unseal(jar[SESSION],cfg.key,'session');
 if(route==='start'&&method==='GET'){
  if(headers['sec-fetch-site']==='cross-site')return json(403,{error:'origin'});
  // WHOOP documents an eight-character state value. It is also bound to an encrypted, short-lived browser cookie.
  const state=crypto.randomBytes(6).toString('base64url');
  const flow=seal({kind:'flow',state,exp:Date.now()+600000},cfg.key);
  const url=new URL(API+'/oauth/oauth2/auth');for(const [k,v]of Object.entries({client_id:cfg.id,redirect_uri:cfg.callback,response_type:'code',scope:'read:recovery read:sleep',state}))url.searchParams.set(k,v);
  return redirect(url.href,[cookie(FLOW,flow,600)]);
 }
 if(route==='callback'&&method==='GET'){
  const flow=unseal(jar[FLOW],cfg.key,'flow'),query=event.queryStringParameters||{};
  const clear=[cookie(FLOW,'',0)];
  if(!flow||typeof query.state!=='string'||!/^[A-Za-z0-9_-]{8}$/.test(query.state)||query.state.length!==flow.state.length||!crypto.timingSafeEqual(Buffer.from(query.state),Buffer.from(flow.state)))return redirect(cfg.origin+'/?whoop=invalid_state',clear);
  if(query.error)return redirect(cfg.origin+'/?whoop=denied',clear);
  if(!query.code||query.code.length>2048)return redirect(cfg.origin+'/?whoop=failed',clear);
  try{
   const response=await upstream(API+'/oauth/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code:query.code,client_id:cfg.id,client_secret:cfg.secret,redirect_uri:cfg.callback}).toString()});
   if(!response.ok)throw Error('exchange');const token=await response.json();
   const scopes=new Set(String(token.scope||'').split(' '));
   if(typeof token.access_token!=='string'||!Number.isFinite(token.expires_in)||token.expires_in<=0||!scopes.has('read:sleep')||!scopes.has('read:recovery'))throw Error('token');
   const ttl=Math.min(3600,token.expires_in);
   return redirect(cfg.origin+'/?whoop=connected',[...clear,cookie(SESSION,seal({kind:'session',token:token.access_token,exp:Date.now()+ttl*1000},cfg.key),ttl)]);
  }catch{return redirect(cfg.origin+'/?whoop=failed',clear);}
 }
 if(route==='readings'||route==='disconnect'){
  if(method!=='POST')return json(405,{error:'method'},{Allow:'POST'});
  if(headers.origin!==cfg.origin)return json(403,{error:'origin',message:'Open LifeAdapt on its configured website and try again.'});
  if(!session){const result=json(401,{error:'reconnect',message:'Your WHOOP connection expired. Connect again to import readings.'});result.multiValueHeaders={'Set-Cookie':[cookie(SESSION,'',0)]};return result;}
  if(route==='disconnect'){
   try{const response=await upstream(API+'/developer/v2/user/access',{method:'DELETE',headers:{Authorization:'Bearer '+session.token}});if(!response.ok&&response.status!==401)throw Error('revoke');}
   catch{return json(502,{error:'disconnect_failed',message:'WHOOP could not confirm disconnection. Please try again, or remove LifeAdapt in WHOOP’s connected apps.'});}
   const result=json(200,{connected:false});result.multiValueHeaders={'Set-Cookie':[cookie(SESSION,'',0),cookie(FLOW,'',0)]};return result;
  }
  try{const readings=await latestReadings(session.token);return readings?json(200,{readings}):json(422,{error:'not_ready',message:'No recent, fully scored recovery and matching sleep are available yet. Sync your WHOOP and try again.'});}
  catch(error){if(error.status===401){const result=json(401,{error:'reconnect',message:'Connect WHOOP again to continue.'});result.multiValueHeaders={'Set-Cookie':[cookie(SESSION,'',0)]};return result;}return json(error.status===429?429:502,{error:'unavailable',message:error.status===429?'WHOOP is limiting requests. Wait a minute and try again.':'WHOOP readings are temporarily unavailable. Please try again.'});}
 }
 return json(404,{error:'not_found'});
}
exports.handler=handler;
exports._test={config,seal,unseal,normalizeReadings,SESSION,FLOW};
