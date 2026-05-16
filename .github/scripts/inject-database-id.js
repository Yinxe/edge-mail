#!/usr/bin/env node
const fs = require('fs');

const p = process.argv[2] || 'packages/worker/wrangler.jsonc';
const databaseId = process.env.D1_DATABASE_ID;

if (!databaseId) {
  console.error('::error::D1_DATABASE_ID env var is required');
  process.exit(1);
}

const raw = fs.readFileSync(p, 'utf8').replace(/\/\/.*$/gm, '');
const c = JSON.parse(raw);
c.d1_databases[0].database_id = databaseId;
fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');

console.log('=== wrangler.jsonc after inject ===');
const injected = fs.readFileSync(p, 'utf8');
console.log(injected.split('\n').slice(0, 20).join('\n'));
