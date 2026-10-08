import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

fs.rmSync(distDir, { recursive: true, force: true });
fs.cpSync(sourceDir, distDir, { recursive: true });

console.log('Copied doctors_portal into dist so /doctors_portal/ resolves in production.');
