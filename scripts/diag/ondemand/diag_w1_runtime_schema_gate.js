/**
 * W1 runtime schema gate — READ ONLY.
 * Prints only non-secret boolean/config state relevant to Sequelize schema sync.
 */
'use strict';
require('dotenv').config({path:require('path').resolve(__dirname,'../../../.env')});
function b(name){return String(process.env[name]||'').toLowerCase()==='true';}
console.log('=== W1 RUNTIME SCHEMA GATE ===');
console.log('Mesure le '+new Date().toISOString()+' — LECTURE SEULE');
console.log('DB_SYNC_ALTER_TRUE='+(b('DB_SYNC_ALTER')?'YES':'NO'));
console.log('DB_SYNC_TRUE='+(b('DB_SYNC')?'YES':'NO'));
console.log('NODE_ENV='+(process.env.NODE_ENV||'(UNSET)'));
console.log('RULE=Model parity changes are allowed only through governed code + migration review; this diagnostic never enables sync.');
console.log('VERDICT=W1_RUNTIME_SCHEMA_GATE_OBSERVED_READ_ONLY');
