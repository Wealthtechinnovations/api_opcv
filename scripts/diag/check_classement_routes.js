#!/usr/bin/env node
'use strict';

/**
 * Diagnostic: check if classement routes are registered in the Express app.
 * Run on production: node scripts/diag/check_classement_routes.js
 */

console.log('=== Classement Route Diagnostic ===\n');

// Step 1: Check if the route module can be loaded
console.log('1. Loading apigestionsavequotidien module...');
try {
  const router = require('../../src/routes/apigestionsavequotidien');
  console.log('   OK — module loaded successfully');
  console.log('   Type:', typeof router);

  if (router && router.stack) {
    const routes = router.stack
      .filter(r => r.route)
      .map(r => ({ path: r.route.path, methods: Object.keys(r.route.methods) }));
    console.log('   Total routes on router:', routes.length);

    const classRoutes = routes.filter(r => r.path.includes('classement'));
    console.log('   Classement routes found:', classRoutes.length);
    for (const r of classRoutes) {
      console.log('     -', r.methods.join(',').toUpperCase(), r.path);
    }

    if (classRoutes.length === 0) {
      console.log('   *** WARNING: No classement routes found on router! ***');
    }
  } else {
    console.log('   *** WARNING: Router has no .stack property ***');
  }
} catch (err) {
  console.log('   *** FAILED to load module:', err.message);
  console.log('   Stack:', err.stack.split('\n').slice(0, 5).join('\n'));
}

// Step 2: Check if the full app loads and has routes
console.log('\n2. Loading full app.js...');
try {
  const app = require('../../app');
  if (app && app._router && app._router.stack) {
    const appRoutes = [];
    app._router.stack.forEach(layer => {
      if (layer.route) {
        appRoutes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach(sub => {
          if (sub.route) {
            appRoutes.push({ path: sub.route.path, methods: Object.keys(sub.route.methods) });
          }
        });
      }
    });

    console.log('   Total app routes:', appRoutes.length);
    const classRoutes = appRoutes.filter(r => r.path.includes('classement'));
    console.log('   Classement routes in app:', classRoutes.length);
    for (const r of classRoutes) {
      console.log('     -', r.methods.join(',').toUpperCase(), r.path);
    }

    if (classRoutes.length === 0) {
      console.log('   *** WARNING: No classement routes registered in app! ***');
    }
  }
} catch (err) {
  console.log('   *** FAILED to load app:', err.message);
  console.log('   Stack:', err.stack.split('\n').slice(0, 5).join('\n'));
}

// Step 3: HTTP test
console.log('\n3. Testing HTTP requests...');
const http = require('http');

function testRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3005${path}`, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ${path} => ${res.statusCode} ${data.substring(0, 200)}`);
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`   ${path} => ERROR: ${err.message}`);
      resolve();
    });
    req.on('timeout', () => {
      console.log(`   ${path} => TIMEOUT`);
      req.destroy();
      resolve();
    });
  });
}

(async () => {
  await testRoute('/health');
  await testRoute('/api/classementmysql');
  await testRoute('/api/classementeur');
  await testRoute('/api/classementusd');
  await testRoute('/api/savevlmanquante');
  console.log('\n=== Done ===');
  process.exit(0);
})();
