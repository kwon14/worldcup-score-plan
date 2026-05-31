import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const rulesPath = path.join(repoRoot, 'firestore.rules');
const firebaseJsonPath = path.join(repoRoot, 'firebase.json');

function readRequiredFile(filePath: string) {
  assert.ok(fs.existsSync(filePath), `${path.basename(filePath)} 파일이 있어야 합니다`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(source: string, expected: string, message: string) {
  assert.ok(source.includes(expected), message);
}

function run() {
  const rules = readRequiredFile(rulesPath);
  const firebaseJson = JSON.parse(readRequiredFile(firebaseJsonPath)) as { firestore?: { rules?: string } };

  assert.equal(firebaseJson.firestore?.rules, 'firestore.rules', 'firebase.json이 firestore.rules를 배포 대상으로 지정해야 합니다');
  assertContains(rules, 'function isSignedIn()', '로그인 여부 helper가 있어야 합니다');
  assertContains(rules, 'function isAdmin()', '관리자 권한 helper가 있어야 합니다');
  assertContains(rules, "request.auth.token.role == 'admin'", '관리자 권한은 custom claim role=admin으로 판별해야 합니다');
  assertContains(rules, 'function canOperate()', '운영자/관리자 권한 helper가 있어야 합니다');
  assertContains(rules, "request.auth.token.role in ['admin', 'operator']", '운영 데이터 권한은 role 기반으로 admin/operator를 허용해야 합니다');
  assertContains(rules, 'function isPredictionCollection(collectionId)', '경기별 predictions 컬렉션 판별 helper가 있어야 합니다');
  assertContains(rules, 'match /{collectionId}/{participantId}', '경기별 단일 문서 컬렉션 규칙이 있어야 합니다');
  assertContains(rules, 'request.auth.uid == participantId', '참여자는 자기 uid와 같은 문서만 쓸 수 있어야 합니다');
  assertContains(rules, 'function isActualResultCollection(collectionId)', 'actualResult 컬렉션 판별 helper가 있어야 합니다');
  assertContains(rules, 'function isMatchStateCollection(collectionId)', 'matchState 컬렉션 판별 helper가 있어야 합니다');
  assertContains(rules, 'function isMatchEventsCollection(collectionId)', 'matchEvents 컬렉션 판별 helper가 있어야 합니다');
  assertContains(rules, 'allow write: if canOperate();', '운영 데이터 write는 운영자/관리자만 가능해야 합니다');
  assertContains(rules, 'allow list: if isPredictionCollection(collectionId);', 'A안: 예측 목록/순위는 항상 공개 조회되어야 합니다');
  assertContains(rules, 'statusForCollection(collectionId) == \'BEFORE_MATCH\'', '경기 전 상태에서만 일반 예측 생성/전체 수정이 가능해야 합니다');
  assertContains(rules, 'statusForCollection(collectionId) == \'HALF_TIME\'', '하프타임 상태에서는 하프타임 수정 필드만 허용해야 합니다');
  assertContains(rules, 'statusForCollection(collectionId) == \'AFTER_MATCH\'', '경기 후 상태에서는 최종 MVP 필드만 허용해야 합니다');
  assertContains(rules, 'isHalfTimeRevision(collectionId, participantId)', '하프타임 수정 전용 검증 함수가 있어야 합니다');
  assertContains(rules, 'isFinalMvpRevision(collectionId, participantId)', '최종 MVP 수정 전용 검증 함수가 있어야 합니다');
  assertContains(rules, "changedKeys().hasOnly(['finalMvp', 'updatedAt'])", '최종 MVP 수정은 finalMvp와 updatedAt만 바꿀 수 있어야 합니다');
  assert.ok(!/allow\s+(read|write)\s*:\s*if\s+true\s*;/.test(rules), '전체 공개 read/write 규칙이 없어야 합니다');
}

run();
console.log('firestore rules tests passed');
