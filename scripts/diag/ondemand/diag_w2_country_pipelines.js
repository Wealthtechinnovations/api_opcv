/**
 * W2 country pipelines — PRODUCTION READ-ONLY diagnostic.
 *
 * Measures current five-market pipeline state:
 * - canonical fund/VL counts and freshness
 * - staging/audit table presence and approximate row counts
 * - active cron entries
 * - evidence-directory presence
 *
 * No INSERT/UPDATE/DELETE/DDL, no file writes, no secrets printed.
 */
'use strict';

require('dotenv').config({path:require('path').resolve(__dirname,'../../../.env')});
const mysql=require('mysql2/promise');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const DB={
  host:process.env.DB_HOST||'127.0.0.1',
  user:process.env.DB_USER||'fund_opcvm',
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME||'fund_opcvm'
};

const COUNTRIES=['MAROC','NIGERIA','TUNISIE','UEMOA','CEMAC'];
const STAGING_TABLES=[
  'cmf_import_audit','cmf_extreme_variations','cmf_new_funds_queue',
  'brvm_boc_sources','brvm_boc_navs_raw','brvm_fund_aliases','brvm_import_logs','brvm_missing_navs',
  'bvmac_boc_sources','bvmac_boc_navs_raw','bvmac_fund_aliases','bvmac_import_logs','bvmac_missing_navs',
  'sec_ng_observations','sec_ng_fund_aliases','sec_ng_corrections_audit'
];
const CRON_SCRIPTS=[
  'cron_tunisie_daily.sh',
  'cron_brvm_daily.sh',
  'cron_daily_update.sh',
  'cron_nigeria_weekly.sh',
  'cron_indices_daily.sh'
];
const EVIDENCE_DIRS=[
  'data/tunisie_cmf',
  'data/brvm_boc',
  'data/bvmac_boc',
  'sec_ng_downloads'
];

function table(rows){
  if(!rows.length)return '  (aucune ligne)';
  const keys=Object.keys(rows[0]);
  const widths=Object.fromEntries(keys.map(k=>[k,Math.max(k.length,...rows.map(r=>String(r[k]??'').length))]));
  return [
    '  '+keys.map(k=>k.padEnd(widths[k])).join('  '),
    '  '+keys.map(k=>'-'.repeat(widths[k])).join('  '),
    ...rows.map(r=>'  '+keys.map(k=>String(r[k]??'').padEnd(widths[k])).join('  '))
  ].join('\n');
}
function iso(v){if(!v)return null;if(v instanceof Date)return v.toISOString().slice(0,10);return String(v).slice(0,10);}
function countFilesRecursive(dir,limit=50000){
  if(!fs.existsSync(dir))return {present:'NO',files:0};
  let files=0;
  const stack=[dir];
  while(stack.length&&files<limit){
    const cur=stack.pop();
    let entries=[];
    try{entries=fs.readdirSync(cur,{withFileTypes:true});}catch(e){continue;}
    for(const ent of entries){
      if(ent.isDirectory()) stack.push(path.join(cur,ent.name));
      else if(ent.isFile()) files++;
      if(files>=limit)break;
    }
  }
  return {present:'YES',files:files>=limit?('>='+limit):files};
}

async function main(){
  const conn=await mysql.createConnection(DB);
  try{
    console.log('=== W2 COUNTRY PIPELINES — LIVE READ-ONLY INVENTORY ===');
    console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
    console.log('');

    console.log('## A. Canonical fund/VL state by market');
    const [countryRows]=await conn.query(
      `SELECT UPPER(TRIM(f.pays)) pays,
              COUNT(DISTINCT f.id) funds,
              SUM(CASE WHEN f.active=1 THEN 1 ELSE 0 END) active_funds,
              COUNT(v.id) vl_rows,
              DATE_FORMAT(MAX(v.date),'%Y-%m-%d') latest_vl,
              SUM(CASE WHEN v.date>=DATE_SUB(CURDATE(),INTERVAL 30 DAY) THEN 1 ELSE 0 END) vl_30d
         FROM fond_investissements f
         LEFT JOIN valorisations v ON v.fund_id=f.id
        WHERE UPPER(TRIM(f.pays)) IN (?)
        GROUP BY UPPER(TRIM(f.pays))
        ORDER BY FIELD(UPPER(TRIM(f.pays)),'MAROC','NIGERIA','TUNISIE','UEMOA','CEMAC')`,
      [COUNTRIES]
    );
    console.log(table(countryRows.map(r=>({
      pays:r.pays,
      funds:Number(r.funds||0),
      active_funds:Number(r.active_funds||0),
      vl_rows:Number(r.vl_rows||0),
      latest_vl:iso(r.latest_vl),
      vl_30d:Number(r.vl_30d||0)
    }))));
    console.log('');

    console.log('## B. Staging/audit tables');
    const [tables]=await conn.query(
      `SELECT TABLE_NAME,TABLE_ROWS
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE()
          AND TABLE_NAME IN (?)
        ORDER BY TABLE_NAME`,
      [STAGING_TABLES]
    );
    const map=new Map(tables.map(r=>[r.TABLE_NAME,Number(r.TABLE_ROWS||0)]));
    console.log(table(STAGING_TABLES.map(name=>({
      table:name,
      present:map.has(name)?'YES':'NO',
      approx_rows:map.has(name)?map.get(name):'-'
    }))));
    console.log('');

    console.log('## C. Current crontab pipeline entries');
    let cron='';
    try{cron=execFileSync('crontab',['-l'],{encoding:'utf8',timeout:5000});}catch(e){cron='';}
    console.log(table(CRON_SCRIPTS.map(name=>{
      const lines=cron.split(/\r?\n/).filter(l=>l.includes(name)&&!/^\s*#/.test(l));
      return {script:name,active_entries:lines.length,schedule_or_line:lines.length?lines.join(' || ').slice(0,220):'-'};
    })));
    console.log('');

    console.log('## D. Evidence/artifact directories');
    console.log(table(EVIDENCE_DIRS.map(rel=>{
      const s=countFilesRecursive(path.resolve(process.cwd(),rel));
      return {path:rel,present:s.present,files:s.files};
    })));
    console.log('');

    console.log('## E. Source-specific recent audit counts');
    const auditRows=[];
    for(const spec of [
      {table:'cmf_import_audit',label:'TUNISIA_AUDIT'},
      {table:'brvm_boc_sources',label:'UEMOA_SOURCES'},
      {table:'brvm_boc_navs_raw',label:'UEMOA_RAW'},
      {table:'bvmac_boc_sources',label:'CEMAC_SOURCES'},
      {table:'bvmac_boc_navs_raw',label:'CEMAC_RAW'},
      {table:'sec_ng_corrections_audit',label:'NIGERIA_CORRECTIONS_AUDIT'}
    ]){
      if(!map.has(spec.table)){auditRows.push({surface:spec.label,table:spec.table,present:'NO',rows:'-'});continue;}
      const [r]=await conn.query(`SELECT COUNT(*) c FROM \`${spec.table}\``);
      auditRows.push({surface:spec.label,table:spec.table,present:'YES',rows:Number(r[0].c||0)});
    }
    console.log(table(auditRows));
    console.log('');

    console.log('## F. Runtime classification');
    const cronSet=new Set(CRON_SCRIPTS.filter(name=>cron.includes(name)));
    console.log(table([
      {market:'MAROC',pipeline_code:'YES',active_cron:cronSet.has('cron_daily_update.sh')?'YES':'NO',classification:'ACTIVE_IF_DAILY_UPDATE_PRESENT'},
      {market:'NIGERIA',pipeline_code:'YES',active_cron:cronSet.has('cron_nigeria_weekly.sh')?'YES':'NO',classification:'ACTIVE_IF_WEEKLY_PRESENT'},
      {market:'TUNISIE',pipeline_code:'YES',active_cron:cronSet.has('cron_tunisie_daily.sh')?'YES':'NO',classification:'ACTIVE_IF_CMF_CRON_PRESENT'},
      {market:'UEMOA',pipeline_code:'YES',active_cron:cronSet.has('cron_brvm_daily.sh')?'YES':'NO',classification:'ACTIVE_IF_BRVM_CRON_PRESENT'},
      {market:'CEMAC',pipeline_code:'YES',active_cron:cron.includes('bvmac_boc_daily')?'YES':'NO',classification:'CANDIDATE_UNTIL_BVMAC_CRON_AND_STAGING_PROVEN'}
    ]));
    console.log('');

    console.log('VERDICT=W2_COUNTRY_PIPELINES_OBSERVED_READ_ONLY');
  } finally {
    await conn.end();
  }
}
main().catch(e=>{console.error('W2_COUNTRY_PIPELINES_FATAL:',e&&e.message?e.message:String(e));process.exit(2);});
