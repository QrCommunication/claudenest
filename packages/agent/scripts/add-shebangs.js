#!/usr/bin/env node
/**
 * Post-build script: inject #!/usr/bin/env node shebang into hook entry points
 * and mark them executable. Runs after `tsc` in the build step.
 */

import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distHooks = join(__dirname, '..', 'dist', 'hooks');

const SHEBANG = '#!/usr/bin/env node\n';

const HOOK_FILES = [
  'pre-tool-use.js',
  'post-tool-use.js',
  'stop.js',
  'session-end.js',
  'notification.js',
];

for (const file of HOOK_FILES) {
  const filePath = join(distHooks, file);
  const content = readFileSync(filePath, 'utf8');
  if (!content.startsWith('#!')) {
    writeFileSync(filePath, SHEBANG + content, 'utf8');
  }
  // Make executable (rwxr-xr-x)
  chmodSync(filePath, 0o755);
  console.log(`✓ shebang + chmod 755: dist/hooks/${file}`);
}

// ─── MCP entry point ──────────────────────────────────────────────────────────

const distMcp = join(__dirname, '..', 'dist', 'mcp');
const mcpEntry = join(distMcp, 'index.js');
const mcpContent = readFileSync(mcpEntry, 'utf8');
if (!mcpContent.startsWith('#!')) {
  writeFileSync(mcpEntry, SHEBANG + mcpContent, 'utf8');
}
chmodSync(mcpEntry, 0o755);
console.log('✓ shebang + chmod 755: dist/mcp/index.js');
