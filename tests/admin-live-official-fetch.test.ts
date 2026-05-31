import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');

function readRequiredFile(relativePath: string) {
  const filePath = path.join(repoRoot, relativePath);
  assert.ok(fs.existsSync(filePath), `${relativePath} 파일이 있어야 합니다`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(source: string, expected: string, message: string) {
  assert.ok(source.includes(expected), message);
}

function assertNotContains(source: string, forbidden: string, message: string) {
  assert.ok(!source.includes(forbidden), message);
}

function run() {
  const participantPanel = readRequiredFile('components/game/LiveMatchPanel.tsx');
  const adminLivePage = readRequiredFile('app/admin/live/page.tsx');
  const liveRoute = readRequiredFile('app/api/match/live/route.ts');
  const footballApi = readRequiredFile('lib/api/football.ts');
  const finalInputPage = readRequiredFile('app/admin/final-input/page.tsx');

  assertNotContains(
    participantPanel,
    "fetch(`/api/match/live?matchId=${encodeURIComponent(matchId)}`",
    '참가자 화면은 공식 API를 자동 polling하면 안 됩니다. Firebase 수동 입력 데이터만 구독해야 합니다',
  );

  assertContains(adminLivePage, '공식 경기정보 조회', '관리자 화면에 수동 공식 경기정보 조회 버튼이 있어야 합니다');
  assertContains(adminLivePage, '라인업 조회', '관리자 화면에 라인업 1회 조회 버튼이 있어야 합니다');
  assertContains(adminLivePage, '최종 경기 종료', '관리자 화면에 공식 조회/정산과 별도로 최종 경기 종료 버튼이 있어야 합니다');
  assertContains(adminLivePage, 'handleFinalMatchEnd', '최종 경기 종료 버튼은 별도 핸들러로 경기 상태를 종료 처리해야 합니다');
  assertContains(adminLivePage, "requestOfficialData('final')", '최종 경기 종료는 예약 10회 구간을 쓰는 final 모드로 공식 경기정보를 조회해야 합니다');
  assertContains(adminLivePage, "status: 'FT'", '최종 경기 종료 버튼은 Firebase matchState status를 FT로 저장해야 합니다');
  assertContains(adminLivePage, 'Authorization', '관리자 공식 API 조회는 Firebase ID token을 Authorization 헤더로 보내야 합니다');
  assertContains(adminLivePage, '이 내용으로 Firebase 반영', '공식 API 결과는 미리보기 후 Firebase 반영 버튼으로 저장해야 합니다');
  assertContains(adminLivePage, 'deleteMatchEvent', '공식 이벤트 반영 시 기존 수동/공식 이벤트를 정리할 수 있어야 합니다');

  assertContains(liveRoute, "decoded.role !== 'admin' && decoded.role !== 'operator'", '공식 경기정보 API route는 관리자/운영자 role custom claim을 검증해야 합니다');
  assertContains(liveRoute, "mode === 'lineups'", '라인업 조회는 별도 모드로 처리해야 합니다');
  assertContains(liveRoute, "mode === 'summary'", '경기정보 조회는 라인업 없이 스코어/이벤트만 가져오는 모드가 있어야 합니다');
  assertContains(liveRoute, "mode === 'final'", '최종 경기 종료 정산 조회는 예약 10회 구간을 쓰는 final 모드가 있어야 합니다');
  assertContains(liveRoute, 'useReservedQuota', 'final 모드는 일반 90회 제한 이후에도 예약 API 횟수를 사용할 수 있어야 합니다');

  assertContains(footballApi, 'includeLineups?: boolean', '공식 API 함수는 라인업 포함 여부를 선택할 수 있어야 합니다');
  assertContains(footballApi, 'includeEvents?: boolean', '공식 API 함수는 이벤트 포함 여부를 선택할 수 있어야 합니다');

  assertContains(finalInputPage, 'setKoreaFinal(String(state.koreaScore))', '최종 결과 입력은 경기 종료 후 조회된 Firebase 최종 스코어를 기본값으로 채워야 합니다');
}

run();
console.log('admin live official fetch tests passed');
