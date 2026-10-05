/**
 * W1 temporal integrity — PRODUCTION READ-ONLY diagnostic.
 *
 * Measures exposure to look-ahead/future-date semantics in FX and benchmark
 * propagation. SELECT only; no DB/file/runtime mutation and no secret output.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
};

function iso(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0,10);
  return String(v).slice(0,10);
}
function table(rows) {
  if (!rows.length) return '  (aucune ligne)';
  const keys=Object.keys(rows[0]);
  const widths=Object.fromEntries(keys.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
  return [
    '  '+keys.map(k=>k.padEnd(widths[k])).join('  '),
    '  '+keys.map(k=>'-'.repeat(widths[k])).join('  '),
    ...rows.map(r=>'  '+keys.map(k=>String(r[k]??'').padEnd(widths[k])).join('  '))
  ].join('\n');
}
function diffDays(a,b) {
  return Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000);
}
function approx(a,b,tol=0.01) {
  const x=Number(a), y=Number(b);
  return Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=tol;
}

async function main() {
  const conn=await mysql.createConnection(DB);
  try {
    console.log('=== W1 TEMPORAL INTEGRITY — FX / BENCHMARK LOOK-AHEAD ===');
    console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
    console.log('');

    console.log('## A. Bornes des series FX pertinentes');
    const pairs=['EUR/MAD','USD/MAD','EUR/TND','USD/TND','USD/XOF','USD/XAF','USD/EUR','EUR/XOF','EUR/XAF'];
    const [fxBounds]=await conn.query(
      `SELECT paire, MIN(date) min_date, MAX(date) max_date, COUNT(*) rows_count
         FROM devisedechanges
        WHERE paire IN (?)
        GROUP BY paire
        ORDER BY paire`,[pairs]
    );
    console.log(table(fxBounds.map(r=>({paire:r.paire,min_date:iso(r.min_date),max_date:iso(r.max_date),rows_count:Number(r.rows_count||0)}))));
    console.log('');

    const fxMap=new Map(fxBounds.map(r=>[String(r.paire).toUpperCase(),{min:iso(r.min_date),max:iso(r.max_date)}]));
    console.log('## B. Exposition historique avant le premier taux disponible');
    const exposures=[];
    for (const spec of [
      {pays:'MAROC',pairs:['EUR/MAD','USD/MAD']},
      {pays:'TUNISIE',pairs:['EUR/TND','USD/TND']},
    ]) {
      for (const pair of spec.pairs) {
        const bound=fxMap.get(pair);
        if (!bound || !bound.min) {
          exposures.push({pays:spec.pays,pair,first_fx:'ABSENT',vl_before_first_fx:'N/A'});
          continue;
        }
        const [rows]=await conn.query(
          `SELECT COUNT(*) c
             FROM valorisations v
             JOIN fond_investissements f ON f.id=v.fund_id
            WHERE UPPER(f.pays)=? AND v.date < ?`,[spec.pays,bound.min]
        );
        exposures.push({pays:spec.pays,pair,first_fx:bound.min,vl_before_first_fx:Number(rows[0].c||0)});
      }
    }
    console.log(table(exposures));
    console.log('');

    console.log('## C. Benchmark recent — comparaison stored vs latest<=VL vs nearest absolu');
    const [vls]=await conn.query(
      `SELECT v.id, v.fund_id, DATE_FORMAT(v.date,'%Y-%m-%d') date,
              v.indRef, v.ID_indice, f.pays
         FROM valorisations v
         JOIN fond_investissements f ON f.id=v.fund_id
        WHERE v.date >= DATE_SUB(CURDATE(), INTERVAL 120 DAY)
          AND v.indRef IS NOT NULL AND v.indRef > 0
          AND v.ID_indice IS NOT NULL AND TRIM(v.ID_indice)<>''
        ORDER BY v.date, v.id`
    );
    let minDate=null,maxDate=null;
    for(const v of vls){ if(!minDate||v.date<minDate)minDate=v.date;if(!maxDate||v.date>maxDate)maxDate=v.date; }
    let idxRows=[];
    if(minDate&&maxDate){
      const start=new Date(minDate+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-7);
      const end=new Date(maxDate+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+7);
      [idxRows]=await conn.query(
        `SELECT id_indice, DATE_FORMAT(date,'%Y-%m-%d') date, valeur
           FROM indice_references
          WHERE date BETWEEN ? AND ? AND valeur IS NOT NULL AND valeur>0
          ORDER BY id_indice,date`,
        [start.toISOString().slice(0,10),end.toISOString().slice(0,10)]
      );
    }
    const byIdx=new Map();
    for(const r of idxRows){
      const k=String(r.id_indice);
      if(!byIdx.has(k))byIdx.set(k,[]);
      byIdx.get(k).push({date:r.date,value:Number(r.valeur)});
    }
    const stats=new Map();
    function bucket(pays){
      const k=String(pays||'(UNKNOWN)');
      if(!stats.has(k))stats.set(k,{pays:k,rows:0,exact:0,stored_matches_latest_prior:0,stored_matches_future:0,future_nearest_candidate:0,no_series:0});
      return stats.get(k);
    }
    const examples=[];
    for(const v of vls){
      const s=bucket(v.pays);s.rows++;
      const series=byIdx.get(String(v.ID_indice))||[];
      if(!series.length){s.no_series++;continue;}
      const exact=series.find(x=>x.date===v.date);
      if(exact)s.exact++;
      let prior=null,future=null,nearest=null,nearestAbs=Infinity;
      for(const x of series){
        const d=diffDays(v.date,x.date);
        if(d<=0 && Math.abs(d)<=7 && (!prior || x.date>prior.date)) prior=x;
        if(d>0 && d<=7 && (!future || x.date<future.date)) future=x;
        const ad=Math.abs(d);
        if(ad<=7 && ad<nearestAbs){nearest=x;nearestAbs=ad;}
      }
      if(prior && approx(v.indRef,prior.value))s.stored_matches_latest_prior++;
      if(future && approx(v.indRef,future.value) && (!prior || !approx(v.indRef,prior.value))){
        s.stored_matches_future++;
        if(examples.length<20)examples.push({pays:v.pays,fund_id:Number(v.fund_id),vl_date:v.date,index_id:v.ID_indice,future_date:future.date,gap_days:diffDays(v.date,future.date)});
      }
      if(nearest && nearest.date>v.date)s.future_nearest_candidate++;
    }
    console.log(table([...stats.values()].sort((a,b)=>b.rows-a.rows)));
    console.log('');
    console.log('Exemples stored correspondant a une valeur future (IDs/date uniquement, max 20):');
    console.log(table(examples));
    console.log('');

    console.log('## D. Chemins de code temporalement sensibles — constat');
    console.log('  FOREX_SHARED_GETRATE=FALLS_FORWARD_TO_FIRST_FUTURE_WHEN_NO_PRIOR');
    console.log('  MAROC_ASFIM=FIRST_FUTURE_FX_PLUS_HARDCODED_RATE_FALLBACK');
    console.log('  TUNISIE_CMF=FIRST_FUTURE_FX_WHEN_NO_PRIOR');
    console.log('  BRVM_BOC=LATEST_GLOBAL_USD_XOF_AT_PROMOTION');
    console.log('  BVMAC_BOC=LATEST_GLOBAL_USD_XAF_AT_PROMOTION');
    console.log('  INDEX_PROPAGATION=ABSOLUTE_NEAREST_WITHIN_7D_CAN_SELECT_FUTURE');
    console.log('');
    console.log('VERDICT=W1_TEMPORAL_EXPOSURE_MEASURED_READ_ONLY');
  } finally {
    await conn.end();
  }
}
main().catch(err=>{console.error('W1_TEMPORAL_DIAG_FATAL:',err&&err.message?err.message:String(err));process.exit(2);});
