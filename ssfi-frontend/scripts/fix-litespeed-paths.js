/**
 * Postbuild script: Fix parentheses in chunk paths for LiteSpeed compatibility.
 *
 * Hostinger's LiteSpeed web server rejects literal parentheses in URL paths,
 * returning 404 for requests like /_next/static/chunks/app/(public)/events/page.js
 * but correctly serves /_next/static/chunks/app/%28public%29/events/page.js
 *
 * This script rewrites ALL build output files (JSON manifests AND JS bundles)
 * so the browser requests URL-encoded paths that LiteSpeed will accept.
 */
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');

// Matches parenthesized route-group segments in chunk/static paths
// e.g. static/chunks/app/(public)/  or  static/chunks/app/(auth)/
const CHUNK_PATH_RE = /static\/chunks\/app\/\([^)]+\)\//g;

// Also match in manifest keys like "/(public)/events" that map to chunk arrays
// These appear in _buildManifest.js as object keys
const MANIFEST_KEY_RE = /\/\(([^)]+)\)\//g;

function encodeParens(str) {
  return str.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

/**
 * Fix a single file — works on JSON, JS, and HTML files.
 */
function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  let fixed = original;

  // 1. Encode parentheses in chunk file paths
  //    e.g. static/chunks/app/(public)/page-xxx.js → static/chunks/app/%28public%29/page-xxx.js
  fixed = fixed.replace(CHUNK_PATH_RE, (match) => encodeParens(match));

  // 2. For _buildManifest.js: also encode the object keys that reference route groups
  //    e.g. "/(public)/events": [...] → "/%28public%29/events": [...]
  if (filePath.endsWith('_buildManifest.js') || filePath.endsWith('_ssgManifest.js')) {
    fixed = fixed.replace(MANIFEST_KEY_RE, (match) => encodeParens(match));
  }

  // 3. For server-side files: encode route-group references in page paths
  //    These appear in server manifests like pages-manifest.json, middleware-manifest.json
  if (filePath.includes('server') && (filePath.endsWith('.json') || filePath.endsWith('.js'))) {
    fixed = fixed.replace(
      /app\/\(([^)]+)\)\//g,
      (match) => encodeParens(match)
    );
  }

  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed);
    return true;
  }
  return false;
}

/**
 * Recursively walk a directory and fix all text files.
 */
function walkAndFix(dir, extensions) {
  let count = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and cache directories
      if (entry.name === 'node_modules' || entry.name === 'cache') continue;
      count += walkAndFix(full, extensions);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        try {
          if (fixFile(full)) {
            console.log(`  Fixed: ${path.relative(NEXT_DIR, full)}`);
            count++;
          }
        } catch (e) {
          // Skip files that can't be read (binary, etc.)
        }
      }
    }
  }
  return count;
}

console.log('Fixing LiteSpeed parentheses in build output...');
console.log(`Build directory: ${NEXT_DIR}`);

if (!fs.existsSync(NEXT_DIR)) {
  console.error('ERROR: .next directory not found!');
  process.exit(1);
}

const TEXT_EXTENSIONS = ['.json', '.js', '.html', '.css', '.mjs'];

// Fix everything in .next/
const totalFixed = walkAndFix(NEXT_DIR, TEXT_EXTENSIONS);

console.log(`\nDone. Fixed ${totalFixed} file(s).`);

if (totalFixed === 0) {
  console.log('(No route-group parentheses found in build output — nothing to fix)');
}
