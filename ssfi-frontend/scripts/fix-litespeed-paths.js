/**
 * Postbuild script: Fix parenthesized route-group names for LiteSpeed compatibility.
 *
 * Hostinger's LiteSpeed web server rejects URLs containing literal parentheses
 * AND percent-encoded parentheses (%28 / %29). It either returns 404 or issues
 * a malformed 308 redirect (appending a slash inside the parens).
 *
 * Fix strategy:
 *  1. Rename ONLY the static/chunks/app/(group) directories to _group_
 *     (server/app/(group) must stay as-is for Next.js SSR routing)
 *  2. Rewrite all "static/chunks/app/(group)/" references in build output
 *     to "static/chunks/app/_group_/" — these are browser-facing URLs
 *  3. Do NOT touch "server/app/(group)/" references — those are server-side
 */
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');

// Tracks which directories were renamed
const renamedDirs = [];

/**
 * Rename parenthesized directories ONLY under static/chunks/app/
 * e.g. .next/static/chunks/app/(public) → .next/static/chunks/app/_public_
 */
function renameChunkDirs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === 'cache') continue;

    const oldPath = path.join(dir, entry.name);
    const parenMatch = entry.name.match(/^\(([^)]+)\)$/);

    if (parenMatch) {
      const safeName = `_${parenMatch[1]}_`;
      const newPath = path.join(dir, safeName);

      fs.renameSync(oldPath, newPath);
      renamedDirs.push({ from: entry.name, to: safeName });
      console.log(`  Renamed: ${path.relative(NEXT_DIR, oldPath)} → ${safeName}`);

      // Recurse into renamed directory
      renameChunkDirs(newPath);
    } else {
      renameChunkDirs(oldPath);
    }
  }
}

/**
 * Fix static chunk references in a single file.
 * ONLY replaces "static/chunks/app/(group)/" patterns — never "server/app/(group)/".
 */
function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  let fixed = original;

  // Replace literal: static/chunks/app/(public)/ → static/chunks/app/_public_/
  fixed = fixed.replace(/(static\/chunks\/app\/)\(([^)]+)\)\//g, (match, prefix, name) => {
    return `${prefix}_${name}_/`;
  });

  // Replace percent-encoded: static/chunks/app/%28public%29/ → static/chunks/app/_public_/
  fixed = fixed.replace(/(static\/chunks\/app\/)%28([^%]+)%29\//g, (match, prefix, name) => {
    return `${prefix}_${name}_/`;
  });

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

// Step 1: Rename directories ONLY under static/chunks/app/
console.log('\nStep 1: Renaming static chunk directories...');
const chunksAppDir = path.join(NEXT_DIR, 'static', 'chunks', 'app');
if (fs.existsSync(chunksAppDir)) {
  renameChunkDirs(chunksAppDir);
}
// Also handle standalone build output
const standaloneChunksDir = path.join(NEXT_DIR, 'standalone', '.next', 'static', 'chunks', 'app');
if (fs.existsSync(standaloneChunksDir)) {
  renameChunkDirs(standaloneChunksDir);
}
console.log(`  Renamed ${renamedDirs.length} directories.`);

// Step 2: Fix static/chunks references in ALL text files
console.log('\nStep 2: Fixing static chunk references in build files...');
const TEXT_EXTENSIONS = ['.json', '.js', '.html', '.mjs'];
const totalFixed = walkAndFix(NEXT_DIR, TEXT_EXTENSIONS);

console.log(`\nDone. Renamed ${renamedDirs.length} directories, fixed ${totalFixed} file(s).`);

if (renamedDirs.length === 0 && totalFixed === 0) {
  console.log('(No route-group parentheses found in build output — nothing to fix)');
}
