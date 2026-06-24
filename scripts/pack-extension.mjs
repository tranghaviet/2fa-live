import { readFileSync, writeFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const distDir = join(rootDir, 'dist');
const targetArg = process.argv[2] ?? 'chrome';
const target = targetArg.toLowerCase();

if (target !== 'chrome' && target !== 'firefox') {
  throw new Error(`Unsupported target "${targetArg}". Use "chrome" or "firefox".`);
}

const extension = target === 'firefox' ? 'xpi' : 'zip';
const archiveName = `${packageJson.name}-${packageJson.version}-${target}.${extension}`;
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

if (target === 'firefox') {
  run('npm', ['run', 'build:firefox']);
} else {
  run('npm', ['run', 'build']);
}

try {
  await access(join(distDir, 'manifest.json'));
} catch {
  throw new Error('Expected dist/manifest.json after build, but it was not found.');
}

if (target === 'firefox') {
  const manifestPath = join(distDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const gecko = manifest.browser_specific_settings?.gecko ?? {};
  manifest.browser_specific_settings = {
    ...manifest.browser_specific_settings,
    gecko: {
      ...gecko,
      data_collection_permissions: { required: ['none'] },
    },
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

run('zip', ['-r', '-FS', archivePath, '.', '-x', '*.DS_Store', '__MACOSX/*'], {
  cwd: distDir,
});

console.log(`Packed ${archiveName}`);
