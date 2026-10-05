/**
 * W2 Country Panel contract probe — PRODUCTION READ-ONLY.
 *
 * Performs GET requests only against localhost API to prove which legacy
 * Country Panel contracts are actually mounted in the production monolith.
 * No POST/PUT/DELETE/PATCH and no response payloads are persisted.
 */
'use strict';

const http=require('http');

const endpoints=[
  {name:'getPays',path:'/api/getPays'},
  {name:'getRegulateur_MAROC',path:'/api/getRegulateur?pays=MAROC'},
  {name:'getDevise_MAROC',path:'/api/getDevise?pays=MAROC'},
  {name:'getfondbyuser_MAROC',path:'/api/getfondbyuser/0?pays=MAROC'},
  {name:'getfondbyuservalide_MAROC',path:'/api/getfondbyuservalide/0?pays=MAROC'},
  {name:'getallfondsvlanomalie_MAROC',path:'/api/getallfondsvlanomalie?pays=MAROC'},
  {name:'getfondbypays_MAROC',path:'/api/getfondbypays/MAROC'}
];

function get(pathname){
  return new Promise((resolve)=>{
    const req=http.get({hostname:'127.0.0.1',port:3005,path:pathname,timeout:10000,headers:{Accept:'application/json'}},res=>{
      let body='';
      res.on('data',chunk=>{if(body.length<4096)body+=chunk.toString();});
      res.on('end',()=>{
        let shape='NON_JSON';
        try{
          const j=JSON.parse(body||'{}');
          if(j&&typeof j==='object'){
            shape=Object.keys(j).slice(0,10).sort().join(',')||'EMPTY_OBJECT';
          }
        }catch(e){}
        resolve({
          status:res.statusCode,
          content_type:String(res.headers['content-type']||'').split(';')[0],
          json_top_keys:shape,
          body_bytes_seen:Buffer.byteLength(body)
        });
      });
    });
    req.on('timeout',()=>{req.destroy();resolve({status:'TIMEOUT',content_type:'-',json_top_keys:'-',body_bytes_seen:0});});
    req.on('error',e=>resolve({status:'ERROR',content_type:'-',json_top_keys:e.code||'ERROR',body_bytes_seen:0}));
  });
}
function table(rows){
  if(!rows.length)return '  (aucune ligne)';
  const ks=Object.keys(rows[0]);
  const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
  return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');
}
(async()=>{
  console.log('=== W2 COUNTRY PANEL CONTRACTS — LIVE GET PROBE ===');
  console.log('Mesure le '+new Date().toISOString()+' — GET ONLY');
  const rows=[];
  for(const ep of endpoints){
    const r=await get(ep.path);
    rows.push({name:ep.name,path:ep.path,status:r.status,content_type:r.content_type,json_top_keys:r.json_top_keys,body_bytes_seen:r.body_bytes_seen});
  }
  console.log(table(rows));
  console.log('');
  console.log('STATIC_FINDING=routes_vl_admin.js is not mounted by current app.js');
  console.log('STATIC_FINDING=/api/importfondsvl has no current API implementation found by repository search');
  console.log('RULE=Do not mount legacy routes wholesale. Missing contracts require route-by-route auth/ownership and semantic reconciliation.');
  console.log('VERDICT=W2_COUNTRY_PANEL_CONTRACTS_OBSERVED_READ_ONLY');
})().catch(e=>{console.error('W2_COUNTRY_PANEL_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
