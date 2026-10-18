/**
 * W1 supplemental — manager alias candidates, PRODUCTION READ-ONLY.
 *
 * Goal: qualify missing fond_investissements.societe_id without writing anything.
 * It groups current manager text labels and compares them to societes.nom using:
 * - exact normalized equality
 * - country-aware fuzzy similarity
 *
 * No UPDATE/INSERT/DDL. Output is a review report only.
 */
'use strict';
require('dotenv').config({path:require('path').resolve(__dirname,'../../../.env')});
const mysql=require('mysql2/promise');

const DB={
  host:process.env.DB_HOST||'127.0.0.1',
  user:process.env.DB_USER||'fund_opcvm',
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME||'fund_opcvm'
};

function norm(s){
  return String(s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase()
    .replace(/\b(SA|S\.A\.|SAS|SARL|LTD|LIMITED|PLC|INC|SOCIETE|SOCIÉTÉ|GESTION|ASSET MANAGEMENT|ASSET MANAGERS|INVESTMENT MANAGEMENT|CAPITAL MANAGEMENT)\b/g,' ')
    .replace(/[^A-Z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function bigrams(s){
  const x=' '+s+' ';
  const set=new Set();
  for(let i=0;i<x.length-1;i++)set.add(x.slice(i,i+2));
  return set;
}
function dice(a,b){
  if(!a||!b)return 0;
  if(a===b)return 1;
  const A=bigrams(a),B=bigrams(b);let inter=0;
  for(const x of A)if(B.has(x))inter++;
  return (2*inter)/(A.size+B.size);
}
function table(rows){
  if(!rows.length)return '  (aucune ligne)';
  const ks=Object.keys(rows[0]);
  const w=Object.fromEntries(ks.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
  return ['  '+ks.map(k=>k.padEnd(w[k])).join('  '),'  '+ks.map(k=>'-'.repeat(w[k])).join('  '),...rows.map(r=>'  '+ks.map(k=>String(r[k]??'').padEnd(w[k])).join('  '))].join('\n');
}
async function main(){
  const c=await mysql.createConnection(DB);
  try{
    console.log('=== W1 MANAGER ALIAS CANDIDATES — READ ONLY ===');
    console.log('Mesure le '+new Date().toISOString());
    const [funds]=await c.query(
      `SELECT id,nom_fond,pays,societe_gestion
         FROM fond_investissements
        WHERE societe_id IS NULL
          AND societe_gestion IS NOT NULL
          AND TRIM(societe_gestion)<>''
        ORDER BY pays,societe_gestion,id`
    );
    const [orgs]=await c.query('SELECT id,nom,pays FROM societes ORDER BY id');

    const groups=new Map();
    for(const f of funds){
      const key=String(f.pays||'')+'|'+String(f.societe_gestion||'');
      if(!groups.has(key))groups.set(key,{pays:String(f.pays||''),label:String(f.societe_gestion||''),funds:[]});
      groups.get(key).funds.push(f);
    }

    const rows=[]; const summary={EXACT_NORMALIZED:0,HIGH_CONFIDENCE_FUZZY:0,AMBIGUOUS:0,NO_CANDIDATE:0};
    for(const g of groups.values()){
      const n=norm(g.label);
      const candidates=orgs.map(o=>({
        id:o.id,nom:o.nom,pays:o.pays,
        score:dice(n,norm(o.nom)),
        sameCountry:!g.pays||!o.pays||norm(g.pays)===norm(o.pays)
      })).sort((a,b)=>(b.sameCountry-a.sameCountry)||(b.score-a.score));

      const exact=candidates.filter(x=>norm(x.nom)===n);
      let cls='NO_CANDIDATE',best=candidates[0]||null,second=candidates[1]||null;
      if(exact.length===1){cls='EXACT_NORMALIZED';best=exact[0];}
      else if(exact.length>1){cls='AMBIGUOUS';best=exact[0];}
      else if(best&&best.score>=0.90&&(best.sameCountry||!g.pays)&&(!second||best.score-second.score>=0.08)){cls='HIGH_CONFIDENCE_FUZZY';}
      else if(best&&best.score>=0.70){cls='AMBIGUOUS';}
      summary[cls]++;

      rows.push({
        pays:g.pays||'(UNKNOWN)',
        source_label:g.label.slice(0,70),
        funds:g.funds.length,
        class:cls,
        best_societe_id:best?best.id:'-',
        best_name:best?String(best.nom).slice(0,70):'-',
        score:best?best.score.toFixed(3):'-',
        same_country:best?(best.sameCountry?'YES':'NO'):'-'
      });
    }

    console.log('');
    console.log('## A. Classification des labels');
    console.log(table(Object.entries(summary).map(([classification,count])=>({classification,count}))));
    console.log('');
    console.log('## B. Candidats — revue humaine obligatoire');
    console.log(table(rows.sort((a,b)=>a.pays.localeCompare(b.pays)||a.source_label.localeCompare(b.source_label)).slice(0,200)));
    console.log('');
    console.log('FUNDS_WITHOUT_SOCIETE_ID_AND_WITH_TEXT='+funds.length);
    console.log('DISTINCT_MANAGER_LABELS='+groups.size);
    console.log('RULE=No mapping is authorized by this report; exact/fuzzy candidates require source-backed review before any write.');
    console.log('VERDICT=W1_MANAGER_ALIAS_CANDIDATES_MEASURED_READ_ONLY');
  } finally {await c.end();}
}
main().catch(e=>{console.error('W1_MANAGER_ALIAS_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
