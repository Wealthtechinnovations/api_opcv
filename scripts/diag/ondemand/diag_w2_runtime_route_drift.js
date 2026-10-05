/**
 * W2 runtime route drift — PRODUCTION READ-ONLY.
 *
 * Proves whether the currently running api-monolith was started before the
 * current Git checkout and whether legacy Country Panel routes are live in
 * memory although current app.js no longer mounts routes_vl_admin.js.
 *
 * READ ONLY: pm2 jlist, git rev-parse/log, fs reads, localhost GET probes.
 */
'use strict';

const fs=require('fs');
const {execFileSync}=require('child_process');
const http=require('http');
const path=require('path');

function sh(cmd,args=[]){
  try{return execFileSync(cmd,args,{encoding:'utf8',timeout:10000}).trim();}
  catch(e){return '';}
}
function get(pathname){
  return new Promise(resolve=>{
    const req=http.get({hostname:'127.0.0.1',port:3005,path:pathname,timeout:8000,headers:{Accept:'application/json'}},res=>{
      let bytes=0;
      res.on('data',c=>{bytes+=c.length;});
      res.on('end',()=>resolve({status:res.statusCode,bytes}));
    });
    req.on('timeout',()=>{req.destroy();resolve({status:'TIMEOUT',bytes:0});});
    req.on('error',e=>resolve({status:e.code||'ERROR',bytes:0}));
  });
}
function table(rows){
  if(!rows.length)return '  (aucune ligne)';
  const ks=Object.keys(rows[0]);
  const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
  return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');
}

(async()=>{
  console.log('=== W2 RUNTIME ROUTE DRIFT — READ ONLY ===');
  console.log('Mesure le '+new Date().toISOString());

  const head=sh('git',['rev-parse','HEAD']);
  const headMsg=sh('git',['log','-1','--pretty=%s']);
  let pm2=[];
  try{pm2=JSON.parse(sh('pm2',['jlist'])||'[]');}catch(e){}
  const api=pm2.find(x=>x.name==='api-monolith');
  const startedMs=api?.pm2_env?.pm_uptime||null;
  const startedIso=startedMs?new Date(startedMs).toISOString():null;
  const restarts=api?.pm2_env?.restart_time??null;
  const scriptPath=api?.pm2_env?.pm_exec_path||null;
  const cwd=api?.pm2_env?.pm_cwd||null;

  const appPath=path.resolve(process.cwd(),'app.js');
  const appText=fs.existsSync(appPath)?fs.readFileSync(appPath,'utf8'):'';
  const adminPath=path.resolve(process.cwd(),'src/routes/routes_vl_admin.js');
  const adminExists=fs.existsSync(adminPath);
  const mountedNow=/routes_vl_admin/.test(appText);

  let commitsSinceStart='UNKNOWN';
  let firstAfter='';
  if(startedIso){
    commitsSinceStart=sh('git',['rev-list','--count',`--since=${startedIso}`,'HEAD'])||'0';
    firstAfter=sh('git',['log',`--since=${startedIso}`,'--reverse','--format=%H %cI %s','-1'])||'';
  }

  console.log('');
  console.log('## A. Process vs checkout');
  console.log(table([{
    git_head:head.slice(0,12),
    head_message:headMsg.slice(0,80),
    pm2_script:scriptPath||'-',
    pm2_cwd:cwd||'-',
    process_started:startedIso||'-',
    restart_count:restarts===null?'-':restarts,
    commits_since_process_start:commitsSinceStart
  }]));
  console.log('');
  console.log('FIRST_COMMIT_AFTER_PROCESS_START='+(firstAfter||'-'));

  console.log('');
  console.log('## B. Current checkout route wiring');
  console.log('CURRENT_APP_MOUNTS_ROUTES_VL_ADMIN='+(mountedNow?'YES':'NO'));
  console.log('ROUTES_VL_ADMIN_FILE_PRESENT='+(adminExists?'YES':'NO'));

  console.log('');
  console.log('## C. Routes served by the live in-memory process');
  const rows=[];
  for(const ep of [
    '/api/getfondbyuser/0?pays=MAROC',
    '/api/getfondbyuservalide/0?pays=MAROC',
    '/api/getfondbypays/MAROC',
    '/api/getallfondsvlanomalie?pays=MAROC'
  ]){
    const r=await get(ep);
    rows.push({path:ep,status:r.status,bytes:r.bytes});
  }
  console.log(table(rows));
  console.log('');

  const legacy200=rows.filter(x=>x.status===200).length;
  const drift=(!mountedNow && adminExists && startedMs && legacy200>=2);
  console.log('RUNTIME_ROUTE_DRIFT_CANDIDATE='+(drift?'YES':'NO'));
  console.log('RULE=Do not restart api-monolith solely to test this. First reconstruct route wiring at process start and preserve required Country Panel contracts with explicit auth/RBAC.');
  console.log('VERDICT=W2_RUNTIME_ROUTE_DRIFT_OBSERVED_READ_ONLY');
})().catch(e=>{console.error('W2_RUNTIME_ROUTE_DRIFT_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
