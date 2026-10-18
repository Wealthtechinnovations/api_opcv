/**
 * W1 Nigeria metadata transport readiness — READ ONLY.
 * Reads the current SEC CSV and measures whether provenance/type fields already
 * emitted by the extractor can be transported by import_vl_nigeria_sec.js.
 * No DB writes and no file writes.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const csv=require('csv-parser');

const CSV_PATH=path.resolve(process.cwd(),'sec_ng_latest.csv');
const REQUIRED=[
  'valuation_date','fund_name_clean','vl_price','currency_code',
  'vl_price_source','source_url','source_file','source_title',
  'source_page_url','source_year_page','sheet_name','source_row_number',
  'vl_currency_code','vl_currency_source','vl_currency_confidence'
];
function pct(n,d){return d?(100*n/d).toFixed(1)+'%':'-';}
function table(rows){if(!rows.length)return '  (aucune ligne)';const ks=Object.keys(rows[0]);const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');}
function nonempty(v){return v!==undefined&&v!==null&&String(v).trim()!=='';}
function normalizePriceType(src){
 const s=String(src||'').trim().toLowerCase();
 if(s==='unit_price')return 'UNIT_PRICE';
 if(s==='bid_price'||s==='bid_price_fallback')return 'BID';
 if(s==='offer_price'||s==='offer_price_fallback')return 'OFFER';
 if(s==='nav_total'||s==='nav')return 'NAV_TOTAL';
 return '';
}
async function main(){
 console.log('=== W1 NIGERIA METADATA TRANSPORT READINESS ===');
 console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
 if(!fs.existsSync(CSV_PATH)){console.log('CSV_PRESENT=NO');console.log('VERDICT=W1_NIGERIA_TRANSPORT_SOURCE_UNAVAILABLE');return;}
 console.log('CSV_PRESENT=YES');
 const stat=fs.statSync(CSV_PATH);
 console.log('CSV_SIZE_BYTES='+stat.size);
 console.log('CSV_MTIME='+stat.mtime.toISOString());
 let headers=[];let total=0;
 const counts=Object.fromEntries(REQUIRED.map(k=>[k,0]));
 const priceRaw=new Map(); const mapped=new Map();
 let transportable=0; let withUrlAndType=0; let withCurrencyUrlType=0;
 await new Promise((resolve,reject)=>{
  fs.createReadStream(CSV_PATH)
   .pipe(csv())
   .on('headers',h=>{headers=h.map(x=>String(x).replace(/^\uFEFF/,''));})
   .on('data',row=>{
    total++;
    for(const k of REQUIRED)if(nonempty(row[k]))counts[k]++;
    const raw=String(row.vl_price_source||'').trim()||'(EMPTY)';
    priceRaw.set(raw,(priceRaw.get(raw)||0)+1);
    const pt=normalizePriceType(row.vl_price_source);
    const mk=pt||'(UNMAPPED)';
    mapped.set(mk,(mapped.get(mk)||0)+1);
    if(nonempty(row.valuation_date)&&nonempty(row.fund_name_clean)&&nonempty(row.vl_price))transportable++;
    if(nonempty(row.source_url)&&pt)withUrlAndType++;
    if(nonempty(row.currency_code)&&nonempty(row.source_url)&&pt)withCurrencyUrlType++;
   })
   .on('end',resolve).on('error',reject);
 });
 console.log('');
 console.log('## A. Colonnes attendues dans le CSV courant');
 console.log(table(REQUIRED.map(k=>({column:k,present:headers.includes(k)?'YES':'NO',nonempty_rows:counts[k],coverage:pct(counts[k],total)}))));
 console.log('');
 console.log('## B. vl_price_source brut');
 console.log(table([...priceRaw.entries()].map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count)));
 console.log('');
 console.log('## C. Mapping possible vers vl_contract PRICE_TYPES');
 console.log(table([...mapped.entries()].map(([price_type,count])=>({price_type,count})).sort((a,b)=>b.count-a.count)));
 console.log('');
 console.log('## D. Transportabilite');
 console.log(table([{
   total_rows:total,
   basic_importable:transportable,
   source_url_plus_price_type:withUrlAndType,
   currency_source_price:withCurrencyUrlType,
   source_url_plus_price_pct:pct(withUrlAndType,total),
   full_contract_core_pct:pct(withCurrencyUrlType,total)
 }]));
 console.log('');
 console.log('REPORT_DATE_HEADER='+(headers.includes('report_date')?'YES':'NO'));
 console.log('SEC_DOCUMENT_ID_HEADER='+(headers.includes('sec_document_id')?'YES':'NO'));
 console.log('RULE=Do not fabricate report_date or sec_document_id when absent.');
 console.log('VERDICT=W1_NIGERIA_METADATA_TRANSPORT_READINESS_MEASURED_READ_ONLY');
}
main().catch(e=>{console.error('W1_NIGERIA_TRANSPORT_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
