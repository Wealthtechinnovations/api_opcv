/**
 * W2 CEMAC/BVMAC source + identity mapping preflight — READ ONLY wrapper.
 *
 * The doc-drift ondemand channel executes only *.js files.
 * This wrapper delegates to the existing Python read-only probe and preserves
 * its stdout/stderr/exit code. It performs no DB/file/runtime mutation itself.
 */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const script = path.resolve(__dirname, 'diag_w2_cemac_source_mapping.py');

console.log('=== W2 CEMAC/BVMAC — JS WRAPPER FOR READ-ONLY PYTHON PREFLIGHT ===');
console.log('MODE=READ_ONLY_DELEGATE_NO_DDL_NO_FILE_WRITE_NO_CANONICAL_WRITE');
console.log('PYTHON_SCRIPT=' + script);

const result = spawnSync('python3', [script], {
  cwd: path.resolve(__dirname, '../../..'),
  encoding: 'utf8',
  env: process.env,
  maxBuffer: 20 * 1024 * 1024,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error('W2_CEMAC_WRAPPER_FATAL=' + result.error.message);
  process.exit(2);
}

const code = Number.isInteger(result.status) ? result.status : 2;
console.log('PYTHON_EXIT_CODE=' + code);
process.exit(code);
