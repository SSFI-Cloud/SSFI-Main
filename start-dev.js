const path = require('path');
const cwd = process.cwd();
console.log('[start-dev] Initial CWD:', cwd);
const targetDir = path.join(cwd, 'ssfi-frontend');
console.log('[start-dev] Changing to:', targetDir);
process.chdir(targetDir);
console.log('[start-dev] New CWD:', process.cwd());
require(path.join(cwd, 'ssfi-frontend', 'node_modules', 'next', 'dist', 'bin', 'next'));
