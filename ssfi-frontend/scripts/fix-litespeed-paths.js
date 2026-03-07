/**
 * Postbuild script: Fix parentheses in chunk paths for LiteSpeed compatibility.
 *
 * Hostinger's LiteSpeed web server rejects literal parentheses in URL paths,
 * returning 404 for requests like /_next/static/chunks/app/(public)/events/page.js
 * but correctly serves /_next/static/chunks/app/%28public%29/events/page.js
 *
 * IMPORTANT: Only encode parentheses in BROWSER-FACING URLs (static/chunks/...),
 * never in server-side file paths that Next.js uses to locate files on disk.
 */
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');

// Only matches parenthesized route-group segments in static chunk URLs.
// These are the paths that appear in <script> tags and are fetched by the browser.
// e.g. static/chunks/app/(public)/events/page-xxx.js
const CHUNK_URL_RE = /static\/chunks\/app\/\([^)]+\)\//g;

function encodeParens(str) {
  return str.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

/**
 * Fix a single file — ONLY encodes static/chunks/app/(...) patterns.
 * Does NOT touch server-side file path references.
 */
function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const fixed = original.replace(CHUNK_URL_RE, (match) => encodeParens(match));

  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed);
    return true;
  }
  return false;
}

/**
 * Recursively walk a directory and fix text files.
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
          // Skip files that can't be read
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

const TEXT_EXTENSIONS = ['.json', '.js', '.html', '.mjs'];

const totalFixed = walkAndFix(NEXT_DIR, TEXT_EXTENSIONS);

console.log(`\nDone. Fixed ${totalFixed} file(s).`);

if (totalFixed === 0) {
  console.log('(No route-group parentheses found in build output — nothing to fix)');
}
