import path from 'node:path';

// Patient uploads and local environment files are runtime data, not deployment assets.
export function shouldPackagePortalFile(sourceRoot, source) {
  const parts = path.relative(sourceRoot, source).split(path.sep);
  return !parts.includes('uploads') && !parts.some(part => part.startsWith('.env'));
}
