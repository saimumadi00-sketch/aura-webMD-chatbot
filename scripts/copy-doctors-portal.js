/*
 * Build packaging: copy PHP portal files into dist; actual PHP execution still requires a PHP-capable host.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shouldPackagePortalFile } from './portal-package-filter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve paths from this script rather than the shell's current working directory.
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'doctors_portal');
const distDir = path.join(projectRoot, 'dist', 'doctors_portal');
const distRoot = path.join(projectRoot, 'dist');

if (!fs.existsSync(sourceDir)) {
  console.warn('Skipping doctors portal copy: source folder not found.');
  process.exit(0);
}

if (!fs.existsSync(distRoot)) {
  console.error('Cannot copy doctors portal: dist folder is missing. Run "npm run build" first.');
  process.exit(1);
}

// Replace only the generated portal copy so removed source files do not linger in dist.
fs.rmSync(distDir, { recursive: true, force: true });
// Uploaded patient files and local configuration must never enter a public build.
fs.cpSync(sourceDir, distDir, {
  recursive: true,
  filter: source => shouldPackagePortalFile(sourceDir, source),
});

console.log('Copied doctors_portal into dist so /doctors_portal/ resolves in production.');
