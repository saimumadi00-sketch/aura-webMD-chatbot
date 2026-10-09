<?php
/* PDFs belong outside the public document root; downloads require an admin session. */
function portal_upload_directory(): string {
    $directory = getenv('PORTAL_UPLOAD_DIR') ?: dirname(__DIR__) . '/private/doctor-uploads';
    if (!preg_match('~^(?:[A-Za-z]:[\\/]|/)~', $directory) || str_contains($directory, '..')) {
        throw new RuntimeException('PORTAL_UPLOAD_DIR must be an absolute path without parent segments.');
    }
    $normalized = strtolower(str_replace('\\', '/', rtrim($directory, '/\\')));
    $root = realpath(($_SERVER['DOCUMENT_ROOT'] ?? '') ?: __DIR__) ?: __DIR__;
    $root = strtolower(str_replace('\\', '/', rtrim($root, '/\\')));
    if ($normalized === $root || str_starts_with($normalized, $root . '/')) {
        throw new RuntimeException('PDF storage must be outside the public document root.');
    }
    if (!is_dir($directory) && !mkdir($directory, 0700, true)) throw new RuntimeException('PDF storage is unavailable.');
    $resolved = realpath($directory);
    $actual = strtolower(str_replace('\\', '/', $resolved ?: ''));
    if (!$resolved || $actual === $root || str_starts_with($actual, $root . '/')) throw new RuntimeException('Unsafe PDF storage location.');
    return $resolved;
}

function valid_pdf(string $path): bool {
    if (!is_file($path) || filesize($path) > 5 * 1024 * 1024 || filesize($path) === 0) return false;
    $handle = fopen($path, 'rb');
    if (!$handle) return false;
    $signature = fread($handle, 5);
    fclose($handle);
    // Verify both signature and MIME; fail closed if PHP's fileinfo extension is missing.
    return $signature === '%PDF-' && class_exists('finfo') && (new finfo(FILEINFO_MIME_TYPE))->file($path) === 'application/pdf';
}
