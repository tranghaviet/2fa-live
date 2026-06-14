import { readFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const distDir = join(rootDir, 'dist');
const archiveName = `${packageJson.name}-${packageJson.version}.zip`;
const archivePath = join(rootDir, archiveName);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm', ['run', 'build']);

try {
  await access(join(distDir, 'manifest.json'));
} catch {
  throw new Error('Expected dist/manifest.json after build, but it was not found.');
}

run('zip', ['-r', '-FS', archivePath, '.'], { cwd: distDir });

console.log(`Packed ${archiveName}`);

