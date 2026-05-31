import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const adminLayoutPath = path.join(repoRoot, 'app/admin/layout.tsx');
const adminAuthPath = path.join(repoRoot, 'lib/firebase/adminAuth.ts');
const envExamplePath = path.join(repoRoot, '.env.example');

function readRequiredFile(filePath: string) {
  assert.ok(fs.existsSync(filePath), `${path.relative(repoRoot, filePath)} 파일이 있어야 합니다`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(source: string, expected: string, message: string) {
  assert.ok(source.includes(expected), message);
}

function assertNotContains(source: string, forbidden: string, message: string) {
  assert.ok(!source.includes(forbidden), message);
}

function run() {
  const layout = readRequiredFile(adminLayoutPath);
  const adminAuth = readRequiredFile(adminAuthPath);
  const envExample = readRequiredFile(envExamplePath);

  assertNotContains(layout, 'NEXT_PUBLIC_ADMIN_PASSWORD', '클라이언트 번들에 관리자 PIN/비밀번호를 노출하면 안 됩니다');
  assertNotContains(layout, 'ADMIN_PIN', '관리자 인증은 하드코딩 PIN이 아니라 Firebase Auth custom claim을 사용해야 합니다');
  assertNotContains(layout, 'sessionStorage', '관리자 인증 상태를 sessionStorage 플래그로 저장하면 안 됩니다');
  assertContains(layout, 'useAdminAuth()', '관리자 레이아웃은 Firebase Auth 기반 관리자 가드를 사용해야 합니다');

  assertContains(adminAuth, 'getIdTokenResult', 'custom claim 확인을 위해 getIdTokenResult를 사용해야 합니다');
  assertContains(adminAuth, 'claims.admin === true', '관리자는 custom claim admin=true로 판별해야 합니다');
  assertContains(adminAuth, "fetch('/api/auth/login'", '운영자는 이름/사번/전화번호 서버 검증 후 Custom Token으로 로그인해야 합니다');
  assertContains(adminAuth, 'signInWithCustomToken', '서버에서 받은 Firebase Custom Token으로 로그인해야 합니다');
  assertContains(adminAuth, 'onAuthStateChanged', '새로고침 후에도 Firebase Auth 상태를 구독해야 합니다');
  assertContains(adminAuth, 'signOut', '운영자 로그아웃은 Firebase Auth signOut을 호출해야 합니다');

  assertContains(envExample, 'FIREBASE_ADMIN_PRIVATE_KEY=', 'Custom Token 발급을 위한 Firebase Admin SDK 환경변수를 안내해야 합니다');

  assertNotContains(envExample, 'ADMIN_PASSWORD=', '.env.example에서 더 이상 관리자 비밀번호를 안내하면 안 됩니다');
}

run();
console.log('admin auth tests passed');
