/**
 * Postbuild script: Fix parentheses in chunk paths for LiteSpeed compatibility.
 *
 * Hostinger's LiteSpeed web server rejects literal parentheses in URL paths,
 * returning 404 for requests like /_next/static/chunks/app/(public)/events/page.js
 * but correctly serves /_next/static/chunks/app/%28public%29/events/page.js
 *
 * This script rewrites the Next.js build manifests so the server generates HTML
 * with URL-encoded parentheses in chunk paths.
 */
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');

function encodeParens(str) {
  return str.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function fixJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const original = fs.readFileSync(filePath, 'utf8');
  // Only encode parentheses that appear in chunk/static paths
  const fixed = original.replace(
    /static\/chunks\/app\/\([^)]+\)\//g,
    (match) => encodeParens(match)
  );
  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed);
    const count = (original.match(/static\/chunks\/app\/\([^)]+\)\//g) || []).length;
    console.log(`  Fixed ${count} path(s) in ${path.basename(filePath)}`);
    return true;
  }
  return false;
}

function fixAllFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += fixAllFiles(full);
    } else if (entry.name.endsWith('.json')) {
      if (fixJsonFile(full)) count++;
    }
  }
  return count;
}

console.log('Fixing LiteSpeed parentheses issue in build manifests...');

// Fix top-level manifests
const manifests = [
  'build-manifest.json',
  'app-build-manifest.json',
  'react-loadable-manifest.json',
  'app-path-routes-manifest.json',
  'routes-manifest.json',
];
let fixed = 0;
for (const m of manifests) {
  if (fixJsonFile(path.join(NEXT_DIR, m))) fixed++;
}

// Fix server-side manifests
const serverDir = path.join(NEXT_DIR, 'server');
if (fs.existsSync(serverDir)) {
  fixed += fixAllFiles(serverDir);
}

// Fix standalone manifests if they exist
const standaloneNext = path.join(NEXT_DIR, 'standalone', '.next');
if (fs.existsSync(standaloneNext)) {
  for (const m of manifests) {
    if (fixJsonFile(path.join(standaloneNext, m))) fixed++;
  }
  const standaloneServer = path.join(standaloneNext, 'server');
  if (fs.existsSync(standaloneServer)) {
    fixed += fixAllFiles(standaloneServer);
  }
}

console.log(`Done. Fixed ${fixed} manifest file(s).`);
