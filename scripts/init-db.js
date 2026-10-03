#!/usr/bin/env node
/**
 * Database initialization script
 * Creates all tables from Sequelize models if they don't exist.
 * Run: node scripts/init-db.js
 *
 * Options:
 *   --force    Drop and recreate all tables (DESTRUCTIVE - dev only)
 *   --alter    Alter existing tables to match models (safe for staging)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sequelize } = require('../services/shared/db');

const args = process.argv.slice(2);
const force = args.includes('--force');
const alter = args.includes('--alter');

async function initDatabase() {
  console.log('='.repeat(50));
  console.log('OPCVM Database Initialization');
  console.log('='.repeat(50));
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Mode: ${force ? 'FORCE (drop+recreate)' : alter ? 'ALTER (modify existing)' : 'SAFE (create if not exists)'}`);
  console.log('='.repeat(50));

  if (force) {
    console.log('\n⚠️  WARNING: --force will DROP ALL TABLES and recreate them!');
    console.log('    All data will be permanently lost.\n');
  }

  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    await sequelize.sync({ force, alter });
    console.log('✓ All models synchronized');

    console.log('\n✓ Database initialization complete!');
    console.log('\nNext steps:');
    console.log('  1. Run migrations: npm run migrate');
    console.log('  2. Start services: ./start.sh');
  } catch (error) {
    console.error('\n✗ Database initialization failed:', error.message);

    if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
      console.error(`\n  Database "${process.env.DB_NAME}" does not exist.`);
      console.error('  Create it first: CREATE DATABASE ' + process.env.DB_NAME + ';');
    }

    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initDatabase();
