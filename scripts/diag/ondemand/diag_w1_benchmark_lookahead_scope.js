/**
 * W1 benchmark look-ahead scope — PRODUCTION READ-ONLY.
 * Identifies only high-confidence rows where:
 *  - stored indRef matches a future index point,
 *  - does not match latest prior point,
 *  - and that future point is strictly closer than the prior point.
 * SELECT only, no mutations.
 */
'use strict';
require('dotenv').config({path:require('path').resolve(__dirname,'../../../.env')});
const mysql=require('mysql2/promise');
const DB={host:process.env.DB_HOST||'127.0.0.1',user:process.env.DB_USER||'fund_opcvm',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'fund_opcvm'};

function dayDiff(a,b){return Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000);}
function approx(a,b,t=0.01){const x=Number(a),y=Number(b);return Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=t;}
function table(rows){
 if(!rows.length)return '  (aucune ligne)';
 const ks=Object.keys(rows[0]); const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
 return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');
}
async function main(){
 const conn=await mysql.createConnection(DB);
 try{
  console.log('=== W1 BENCHMARK LOOK-AHEAD — HIGH CONFIDENCE SCOPE ===');
  console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
  console.log('');

  const [vls]=await conn.query(
   `SELECT v.id,v.fund_id,DATE_FORMAT(v.date,'%Y-%m-%d') date,
           v.indRef,v.ID_indice,f.pays
      FROM valorisations v
      JOIN fond_investissements f ON f.id=v.fund_id
     WHERE v.date>=DATE_SUB(CURDATE(),INTERVAL 120 DAY)
       AND v.indRef IS NOT NULL AND v.indRef>0
       AND v.ID_indice IS NOT NULL AND TRIM(v.ID_indice)<>''
     ORDER BY v.date,v.id`
  );
  const [idx]=await conn.query(
   `SELECT id_indice,DATE_FORMAT(date,'%Y-%m-%d') date,valeur
      FROM indice_references
     WHERE date>=DATE_SUB(CURDATE(),INTERVAL 130 DAY)
       AND valeur IS NOT NULL AND valeur>0
     ORDER BY id_indice,date`
  );
  const series=new Map();
  for(const r of idx){const k=String(r.id_indice);if(!series.has(k))series.set(k,[]);series.get(k).push({date:r.date,value:Number(r.valeur)});}

  const bad=[];
  for(const v of vls){
   const arr=series.get(String(v.ID_indice))||[];
   let prior=null,future=null;
   for(const x of arr){
    const d=dayDiff(v.date,x.date);
    if(d<=0 && Math.abs(d)<=7 && (!prior||x.date>prior.date))prior=x;
    if(d>0 && d<=7 && (!future||x.date<future.date))future=x;
   }
   if(!future)continue;
   const priorGap=prior?Math.abs(dayDiff(v.date,prior.date)):Infinity;
   const futureGap=dayDiff(v.date,future.date);
   if(futureGap>=priorGap)continue; // future must be strictly closer
   if(!approx(v.indRef,future.value))continue;
   if(prior && approx(v.indRef,prior.value))continue;
   bad.push({id:Number(v.id),fund_id:Number(v.fund_id),pays:String(v.pays||'(UNKNOWN)'),date:v.date,index_id:String(v.ID_indice),future_date:future.date,gap_days:futureGap,prior_date:prior?prior.date:null});
  }

  const countries=new Map();
  for(const r of bad){
   if(!countries.has(r.pays))countries.set(r.pays,{pays:r.pays,rows:0,funds:new Set(),dates:new Set(),min_date:null,max_date:null});
   const c=countries.get(r.pays);c.rows++;c.funds.add(r.fund_id);c.dates.add(r.date);
   if(!c.min_date||r.date<c.min_date)c.min_date=r.date;if(!c.max_date||r.date>c.max_date)c.max_date=r.date;
  }
  console.log('## A. Scope par pays');
  console.log(table([...countries.values()].map(c=>({pays:c.pays,rows:c.rows,distinct_funds:c.funds.size,distinct_vl_dates:c.dates.size,min_vl_date:c.min_date,max_vl_date:c.max_date})).sort((a,b)=>b.rows-a.rows)));
  console.log('');

  const gaps=new Map();
  for(const r of bad){const k=r.pays+'|'+r.gap_days;if(!gaps.has(k))gaps.set(k,{pays:r.pays,gap_days:r.gap_days,rows:0,funds:new Set()});const g=gaps.get(k);g.rows++;g.funds.add(r.fund_id);}
  console.log('## B. Distribution des ecarts futurs');
  console.log(table([...gaps.values()].map(g=>({pays:g.pays,gap_days:g.gap_days,rows:g.rows,distinct_funds:g.funds.size})).sort((a,b)=>a.pays.localeCompare(b.pays)||a.gap_days-b.gap_days)));
  console.log('');

  const dates=new Map();
  for(const r of bad){const k=r.pays+'|'+r.date+'|'+r.future_date;if(!dates.has(k))dates.set(k,{pays:r.pays,vl_date:r.date,future_date:r.future_date,rows:0,funds:new Set(),index_id:r.index_id});const d=dates.get(k);d.rows++;d.funds.add(r.fund_id);}
  console.log('## C. Principales dates affectees');
  console.log(table([...dates.values()].map(d=>({pays:d.pays,vl_date:d.vl_date,future_date:d.future_date,gap_days:dayDiff(d.vl_date,d.future_date),index_id:d.index_id,rows:d.rows,distinct_funds:d.funds.size})).sort((a,b)=>b.rows-a.rows).slice(0,40)));
  console.log('');

  console.log('## D. Total');
  console.log('  high_confidence_rows='+bad.length);
  console.log('  high_confidence_funds='+new Set(bad.map(r=>r.fund_id)).size);
  console.log('  high_confidence_dates='+new Set(bad.map(r=>r.date)).size);
  console.log('');
  console.log('VERDICT=W1_BENCHMARK_LOOKAHEAD_SCOPE_MEASURED_READ_ONLY');
 }finally{await conn.end();}
}
main().catch(e=>{console.error('W1_BENCHMARK_SCOPE_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
