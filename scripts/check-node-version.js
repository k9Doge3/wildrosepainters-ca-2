#!/usr/bin/env node
/**
 * Enforce Node 20.x locally to avoid subtle Next.js 14 dev server issues seen on 22.x.
 * Skippable by setting SKIP_NODE_VERSION_CHECK=1.
 */
const semver = require('semver');

if (process.env.SKIP_NODE_VERSION_CHECK === '1') {
  process.exit(0);
}

const required = '20.x';
const current = process.version.replace(/^v/, '');

if (!semver.satisfies(current, required)) {
  console.error(`\n[Node Version Check] Required Node ${required}, current v${current}.`);
  console.error('Please install/use Node 20 (e.g. nvm use 20) or export SKIP_NODE_VERSION_CHECK=1 to bypass.');
  process.exit(1);
}

process.exit(0);