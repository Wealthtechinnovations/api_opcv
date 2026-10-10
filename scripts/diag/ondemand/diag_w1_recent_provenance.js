/**
 * W1 recent provenance — PRODUCTION READ-ONLY diagnostic.
 * SELECT only. Measures whether new canonical valuation rows keep provenance
 * and qualification over recent windows.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql=require('mysql2/promise');
const DB={host:process.env.DB_HOST||'127.0.0.1',user:process.env.DB_USER||'fund_opcvm',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'fund_opcvm'};

function table(rows){
 if(!rows.length)return '  (aucune ligne)';
 const ks=Object.keys(rows[0]);
 const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
 return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');
}
function pct(n,d){return d?((100*Number(n||0)/Number(d)).toFixed(1)+'%'):'-';}

async function main(){
 const conn=await mysql.createConnection(DB);
 try{
  console.log('=== W1 RECENT PROVENANCE — CANONICAL VALUATIONS ===');
  console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
  console.log('');

  for(const days of [30,90,365]){
   console.log('## Fenetre '+days+' jours');
   const [rows]=await conn.query(
    `SELECT COALESCE(NULLIF(TRIM(f.pays),''),'(UNKNOWN)') pays,
            COUNT(*) total,
            SUM(v.currency_code IS NOT NULL) with_currency,
            SUM(v.price_type IS NOT NULL) with_price_type,
            SUM(v.source_url IS NOT NULL OR v.sec_document_id IS NOT NULL) with_source,
            SUM(v.report_date IS NOT NULL) with_report_date,
            SUM(v.data_quality IS NOT NULL) with_quality,
            SUM(v.correction_batch IS NOT NULL) with_batch
       FROM valorisations v
       JOIN fond_investissements f ON f.id=v.fund_id
      WHERE v.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY COALESCE(NULLIF(TRIM(f.pays),''),'(UNKNOWN)')
      ORDER BY total DESC`,[days]
   );
   console.log(table(rows.map(r=>({
    pays:r.pays,total:Number(r.total||0),
    currency:pct(r.with_currency,r.total),
    price_type:pct(r.with_price_type,r.total),
    source:pct(r.with_source,r.total),
    report_date:pct(r.with_report_date,r.total),
    quality:pct(r.with_quality,r.total),
    batch:pct(r.with_batch,r.total)
   }))));
   console.log('');
  }

  console.log('## Nigeria — statuts data_quality par annee de VL');
  const [q]=await conn.query(
   `SELECT YEAR(v.date) year, COALESCE(v.data_quality,'(NULL)') quality, COUNT(*) rows_count
      FROM valorisations v
      JOIN fond_investissements f ON f.id=v.fund_id
     WHERE UPPER(f.pays)='NIGERIA'
     GROUP BY YEAR(v.date), COALESCE(v.data_quality,'(NULL)')
     ORDER BY year DESC, rows_count DESC`
  );
  console.log(table(q.map(r=>({year:r.year,quality:r.quality,rows_count:Number(r.rows_count||0)}))));
  console.log('');

  console.log('## Nigeria — 180 jours, combinaison qualification/source');
  const [n]=await conn.query(
   `SELECT COALESCE(v.data_quality,'(NULL)') quality,
            CASE WHEN v.source_url IS NOT NULL OR v.sec_document_id IS NOT NULL THEN 'WITH_SOURCE' ELSE 'NO_SOURCE' END source_state,
            CASE WHEN v.price_type IS NOT NULL THEN 'WITH_PRICE_TYPE' ELSE 'NO_PRICE_TYPE' END price_state,
            COUNT(*) rows_count,
            MIN(v.date) min_date, MAX(v.date) max_date
      FROM valorisations v
      JOIN fond_investissements f ON f.id=v.fund_id
     WHERE UPPER(f.pays)='NIGERIA'
       AND v.date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
     GROUP BY COALESCE(v.data_quality,'(NULL)'),
              CASE WHEN v.source_url IS NOT NULL OR v.sec_document_id IS NOT NULL THEN 'WITH_SOURCE' ELSE 'NO_SOURCE' END,
              CASE WHEN v.price_type IS NOT NULL THEN 'WITH_PRICE_TYPE' ELSE 'NO_PRICE_TYPE' END
     ORDER BY rows_count DESC`
  );
  console.log(table(n.map(r=>({quality:r.quality,source_state:r.source_state,price_state:r.price_state,rows_count:Number(r.rows_count||0),min_date:String(r.min_date||'').slice(0,10),max_date:String(r.max_date||'').slice(0,10)}))));
  console.log('');

  console.log('VERDICT=W1_RECENT_PROVENANCE_MEASURED_READ_ONLY');
 }finally{await conn.end();}
}
main().catch(e=>{console.error('W1_RECENT_PROVENANCE_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
