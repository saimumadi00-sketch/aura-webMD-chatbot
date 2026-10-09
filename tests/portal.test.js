import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';

const binary = spawnSync('php', ['-r', 'echo PHP_BINARY;'], { encoding: 'utf8' });
const available = binary.status === 0;
const extensionArgs = process.platform === 'win32' && available
  ? ['-d', `extension_dir=${path.join(path.dirname(binary.stdout), 'ext')}`, '-d', 'extension=fileinfo', '-d', 'extension=mysqli'] : [];
const php = source => spawnSync('php', [...extensionArgs, '-r', source], { encoding: 'utf8' });

test('portal form validation rejects invalid email/date/time and accepts a future booking', { skip: !available }, () => {
  const result = php(`require 'doctors_portal/validation.php';
    $future = (new DateTimeImmutable('+2 days'))->format('Y-m-d');
    if (validate_booking('Patient', '', '', $future, '14:00', '') !== '') throw new Exception('Valid request rejected');
    foreach ([['bad-email', $future, '14:00'], ['', '2027-02-30', '14:00'], ['', $future, '99:99'], ['', '2000-01-01', '14:00']] as $bad) {
      if (validate_booking('Patient', $bad[0], '', $bad[1], $bad[2], '') === '') throw new Exception('Invalid request accepted');
    }
    echo 'PASS';`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'PASS');
});

test('CSRF allows the issued token and rejects missing, mismatched, and array tokens', { skip: !available }, () => {
  const valid = php(`require 'doctors_portal/session.php'; $_POST['csrf_token'] = csrf_token(); require_valid_csrf(); echo 'PASS';`);
  assert.equal(valid.stdout, 'PASS');
  for (const assignment of ["$_POST = [];", "$_POST['csrf_token'] = 'forged';", "$_POST['csrf_token'] = ['x'];"]) {
    const result = php(`require 'doctors_portal/session.php'; csrf_token(); ${assignment} register_shutdown_function(function(){ echo ':' . http_response_code(); }); require_valid_csrf();`);
    assert.match(result.stdout, /:403$/);
  }
});

test('PDF validation detects forged extensions and storage rejects public directories', { skip: !available }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'aura-pdf-test-'));
  try {
    const valid = path.join(directory, 'valid.pdf');
    const forged = path.join(directory, 'forged.pdf');
    writeFileSync(valid, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
    writeFileSync(forged, '<html>not a PDF</html>');
    const result = php(`require 'doctors_portal/storage.php';
      if (!valid_pdf(${JSON.stringify(valid.replaceAll('\\', '/'))})) throw new Exception('PDF rejected');
      if (valid_pdf(${JSON.stringify(forged.replaceAll('\\', '/'))})) throw new Exception('Forgery accepted');
      $_SERVER['DOCUMENT_ROOT'] = realpath('doctors_portal');
      putenv('PORTAL_UPLOAD_DIR=' . realpath('doctors_portal') . '/uploads');
      try { portal_upload_directory(); throw new Exception('Public storage allowed'); } catch (RuntimeException $expected) { echo 'PASS'; }`);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'PASS');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('web requests cannot mutate via GET, forge booking forms, or fetch legacy uploads', { skip: !available }, async () => {
  const portServer = createServer();
  await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
  const port = portServer.address().port;
  await new Promise(resolve => portServer.close(resolve));
  const child = spawn('php', [...extensionArgs, '-S', `127.0.0.1:${port}`, '-t', 'doctors_portal', 'doctors_portal/router.php'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let logs = '';
  child.stderr.on('data', data => { logs += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      try { await fetch(`${base}/uploads/test.pdf`); ready = true; }
      catch { await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    assert.ok(ready, logs);
    for (const url of ['/admin/doctor_delete.php?id=1', '/admin/logout.php']) assert.equal((await fetch(base + url)).status, 405);
    for (const url of ['/book.php?doctor_id=1', '/admin/login.php', '/admin/doctor_delete.php', '/admin/logout.php']) {
      assert.equal((await fetch(base + url, { method: 'POST', body: 'csrf_token=forged', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' })).status, 403);
    }
    for (const url of ['/uploads/test.pdf', '/%75ploads/test.pdf', '//uploads/.htaccess', '/%2fuploads/test.pdf', '/config.php', '/config.php/extra', '/admin/_auth.php', '//schema.sql', '/schema.sql/extra']) {
      assert.equal((await fetch(base + url, { redirect: 'manual' })).status, 403, url);
    }
    assert.equal((await fetch(base + '/admin/create_admin.php', { method: 'POST' })).status, 403);
  } finally {
    child.kill();
    await new Promise(resolve => child.once('exit', resolve));
  }
});
