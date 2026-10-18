/**
 * W1 Fund/Manager identity gaps — PRODUCTION READ-ONLY.
 * Aggregates identity completeness by country. SELECT only.
 */
'use strict';
require('dotenv').config({path:require('path').resolve(__dirname,'../../../.env')});
const mysql=require('mysql2/promise');
const DB={host:process.env.DB_HOST||'127.0.0.1',user:process.env.DB_USER||'fund_opcvm',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'fund_opcvm'};
function table(rows){if(!rows.length)return '  (aucune ligne)';const ks=Object.keys(rows[0]);const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');}
async function main(){
 const c=await mysql.createConnection(DB);
 try{
  console.log('=== W1 FUND / MANAGER IDENTITY GAPS ===');
  console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
  console.log('');
  const [country]=await c.query(
   `SELECT COALESCE(NULLIF(TRIM(pays),''),'(UNKNOWN)') pays,
           COUNT(*) total,
           SUM(active=1) active,
           SUM(code_ISIN IS NULL OR TRIM(code_ISIN)='') missing_isin,
           SUM(societe_id IS NULL) missing_societe_id,
           SUM(societe_gestion IS NULL OR TRIM(societe_gestion)='') missing_manager_text,
           SUM(societe_id IS NULL AND societe_gestion IS NOT NULL AND TRIM(societe_gestion)<>'') text_without_id
      FROM fond_investissements
     GROUP BY COALESCE(NULLIF(TRIM(pays),''),'(UNKNOWN)')
     ORDER BY total DESC`
  );
  console.log('## A. Completude par pays');
  console.log(table(country.map(r=>({pays:r.pays,total:Number(r.total||0),active:Number(r.active||0),missing_isin:Number(r.missing_isin||0),missing_societe_id:Number(r.missing_societe_id||0),missing_manager_text:Number(r.missing_manager_text||0),text_without_id:Number(r.text_without_id||0)}))));
  console.log('');

  const [unresolved]=await c.query(
   `SELECT COALESCE(NULLIF(TRIM(f.pays),''),'(UNKNOWN)') pays,
           COUNT(*) funds,
           COUNT(DISTINCT UPPER(TRIM(f.societe_gestion))) distinct_manager_labels,
           SUM(CASE WHEN EXISTS (
             SELECT 1 FROM societes s WHERE UPPER(TRIM(s.nom))=UPPER(TRIM(f.societe_gestion))
           ) THEN 1 ELSE 0 END) exact_name_match_available
      FROM fond_investissements f
     WHERE f.societe_id IS NULL
       AND f.societe_gestion IS NOT NULL AND TRIM(f.societe_gestion)<>''
     GROUP BY COALESCE(NULLIF(TRIM(f.pays),''),'(UNKNOWN)')
     ORDER BY funds DESC`
  );
  console.log('## B. Fonds avec texte gestionnaire mais sans societe_id');
  console.log(table(unresolved.map(r=>({pays:r.pays,funds:Number(r.funds||0),distinct_manager_labels:Number(r.distinct_manager_labels||0),exact_name_match_available:Number(r.exact_name_match_available||0)}))));
  console.log('');

  const [dups]=await c.query(
   `SELECT UPPER(TRIM(COALESCE(pays,''))) pays,
           UPPER(TRIM(nom_fond)) normalized_name,
           COUNT(*) rows_count,
           GROUP_CONCAT(id ORDER BY id SEPARATOR ',') fund_ids,
           COUNT(DISTINCT COALESCE(NULLIF(TRIM(code_ISIN),''),'(NO_ISIN)')) isin_variants
      FROM fond_investissements
     WHERE nom_fond IS NOT NULL AND TRIM(nom_fond)<>''
     GROUP BY UPPER(TRIM(COALESCE(pays,''))),UPPER(TRIM(nom_fond))
    HAVING COUNT(*)>1
     ORDER BY rows_count DESC
     LIMIT 50`
  );
  console.log('## C. Doublons nom exact normalise dans un meme pays (max 50)');
  console.log(table(dups.map(r=>({pays:r.pays,normalized_name:r.normalized_name,rows_count:Number(r.rows_count||0),fund_ids:r.fund_ids,isin_variants:Number(r.isin_variants||0)}))));
  console.log('');

  const [docs]=await c.query(
   `SELECT 'documents' entity,COUNT(*) total,SUM(societe_id IS NULL) missing_societe_id,
           SUM(fond_id IS NULL) missing_fond_id FROM documents
    UNION ALL
    SELECT 'personnel_sgs',COUNT(*),SUM(societe_id IS NULL),NULL FROM personnel_sgs`
  );
  console.log('## D. Relations documents/personnel');
  console.log(table(docs.map(r=>({entity:r.entity,total:Number(r.total||0),missing_societe_id:Number(r.missing_societe_id||0),missing_fond_id:r.missing_fond_id===null?'-':Number(r.missing_fond_id||0)}))));
  console.log('');
  console.log('VERDICT=W1_IDENTITY_GAPS_MEASURED_READ_ONLY');
 }finally{await c.end();}
}
main().catch(e=>{console.error('W1_IDENTITY_DIAG_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
