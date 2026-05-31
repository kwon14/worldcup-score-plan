# Worldcup Score Plan 운영 준비 작업 목록

> 작성일: 2026-05-31  
> 목적: 월드컵 예측 게임을 실제 운영 가능한 수준으로 만들기 위해 남은 작업을 우선순위별로 정리한다.

## 현재 상태 요약

- Next.js / React / TypeScript / Firebase Firestore 기반 예측 게임 앱이다.
- 예측 제출, 하프타임 수정, MVP 제출, 관리자 결과 입력, 순위 표시 흐름은 구현되어 있다.
- 타이브레이커 로직과 기본 회귀 테스트는 추가되어 있다.
- 실시간 경기정보 API-Football 연동 경로는 추가되어 있으나, B안 운영 기준에서는 공식 API를 선택 사항으로 두고 네이버/구글/중계 앱을 사람이 확인해 관리자 화면에서 Firebase에 수동 입력한다.
- 운영 전 가장 큰 리스크는 Firestore Security Rules, 관리자 인증, 경기 상태별 서버/DB 권한 제어다.

---

## P0. 운영 전 필수 작업

### 1. Firestore Security Rules 작성 및 적용 — 완료

**문제**  
현재 앱은 클라이언트에서 Firestore에 직접 쓰는 구조다. Security Rules가 없거나 느슨하면 누구나 예측, 결과, 경기 상태, 이벤트 데이터를 조작할 수 있다.

**필요 정책**

- 일반 참여자는 예측 생성만 가능
- 참여자는 자기 예측만 수정 가능
- 경기 상태에 따라 수정 가능 필드 제한
  - 경기 전: 전체 예측 제출/수정 가능
  - 하프타임: 허용된 하프타임 수정 필드만 수정 가능
  - 경기 종료 후: 참여자 수정 불가
- 운영자만 다음 데이터 수정 가능
  - 실제 경기 결과
  - 게임 상태
  - matchState
  - matchEvents
- 결과 공개 전에는 순위/상세 예측 접근 정책 결정 필요

**관련 파일/영역**

- `lib/firebase/predictions.ts`
- `lib/firebase/results.ts`
- `lib/firebase/matchState.ts`
- Firebase Console 또는 `firestore.rules`

**완료 기준**

- [x] Firestore Rules 파일 작성
- [x] `firebase.json`에 Rules 배포 대상 연결
- [x] Rules 정적 회귀 테스트 추가
- [x] 참여자 문서 ID를 Firebase Auth anonymous UID 기반으로 전환
- [ ] Firebase Console에서 Anonymous Auth 활성화 확인
- [ ] Firebase Emulator 또는 스테이징에서 실제 권한 시나리오 검증

---

### 2. 관리자 인증 강화 — 완료

**문제**  
현재 관리자 접근 제어가 간단한 PIN/password 방식에 가깝다. 특히 클라이언트에 노출되는 환경변수나 프론트 단 인증만으로는 운영자 권한 보호가 어렵다.

**작업**

- `NEXT_PUBLIC_ADMIN_PASSWORD` 같은 클라이언트 노출 인증값 제거 여부 확인
- 서버 또는 Firebase Auth 기반 운영자 인증 방식 결정
- 운영자 여부를 Security Rules에서 검증 가능한 구조로 변경
- 관리자 페이지 접근과 Firestore 쓰기 권한을 분리하지 말고 함께 보호

**관련 파일/영역**

- `app/admin/page.tsx`
- `app/admin/layout.tsx`
- `lib/firebase/*`
- Firebase Auth / custom claims / Security Rules

**완료 기준**

- [x] `NEXT_PUBLIC_ADMIN_PASSWORD`/PIN 기반 관리자 인증 제거
- [x] Firebase Email/Password 로그인 + custom claim `admin=true` 기반 관리자 가드 추가
- [x] 운영자가 아닌 사용자는 관리자 페이지 조작 불가
- [x] 운영자가 아닌 사용자는 결과/상태/이벤트 Firestore write 불가
- [x] 인증값이 브라우저 번들에 노출되지 않음
- [x] 관리자 인증 정책 회귀 테스트 추가
- [ ] Firebase Console에서 Email/Password Auth 활성화 및 운영자 custom claim 부여 확인

---

### 3. 경기 상태별 제출/수정 제한 강화

**문제**  
UI에서 버튼을 숨기는 것만으로는 충분하지 않다. 사용자가 직접 Firestore/API를 호출하면 상태 제한을 우회할 수 있다.

**작업**

- 경기 상태별 허용 동작 정의
- 예측 생성/수정 가능 시간 검증
- 하프타임 수정 가능 필드 제한
- 최종 결과 입력 후 참여자 수정 차단
- Security Rules 또는 서버 API에서 강제

**관련 파일/영역**

- `app/(participant)/predict/page.tsx`
- `app/(participant)/halftime/page.tsx`
- `lib/firebase/predictions.ts`
- `lib/firebase/matchState.ts`

**완료 기준**

- 경기 상태별 write 시나리오 테스트 통과
- UI 우회 요청도 차단됨

---

### 4. 실시간 경기정보 운영 설정 — B안 결정

**문제**  
API-Football 연동 코드는 준비되어 있지만, 무료 플랜 100 req/day는 경기 중 자동 실시간 연동에는 부족하다. 운영 기준은 공식 API 자동 연동이 아니라 네이버/구글/중계 앱을 사람이 확인하고 관리자 화면에서 Firebase에 수동 입력하는 방식으로 정한다.

**작업**

- `FOOTBALL_API_KEY`는 기본적으로 비워두고 공식 API 자동 연동을 끈다.
- 관리자는 네이버/구글/중계 앱에서 점수, 득점, 카드 정보를 확인한다.
- 확인한 경기 정보를 관리자 화면에서 Firebase에 수동 입력한다.
- 공식 API를 보조로 켤 경우에만 `FOOTBALL_API_KEY`와 fixture ID를 설정한다.
- 무료 플랜으로 보조 연동을 켤 때는 캐시를 길게 둔다.

```env
FOOTBALL_API_KEY=
FOOTBALL_FIXTURE_ID_M2=
FOOTBALL_FIXTURE_ID_M1=
FOOTBALL_LIVE_CACHE_SECONDS=300
FOOTBALL_LINEUP_CACHE_SECONDS=1800
NEXT_PUBLIC_LIVE_POLL_INTERVAL_SECONDS=60
```

**관련 파일/영역**

- `.env.example`
- `lib/api/football.ts`
- `app/api/match/live/route.ts`
- `components/game/LiveMatchPanel.tsx`

**완료 기준**

- [x] 공식 API key 없이도 Firebase 수동 입력 fallback으로 동작
- [x] `.env.example`에 B안 무료/수동 운영 기준 명시
- [x] API 실패 시 Firebase 수동 입력 fallback 확인

---

## P1. 운영 안정성 개선

### 5. API-Football 요청량 최적화 — 완료

**문제**  
현재 구조는 30초마다 live endpoint를 호출하며, 내부적으로 fixture/events/lineups를 조회한다. 무료 플랜에서는 요청량이 부족할 수 있다.

**작업**

- 라인업은 경기 전/초반 이후 5~10분 캐시
- 스코어/이벤트만 짧은 주기로 갱신
- polling 간격을 설정값으로 분리
- API 요청 실패/쿼터 초과 시 사용자 메시지 개선

**완료 기준**

- [x] 경기 2시간 운영 기준 예상 요청량 산출
- [x] 무료/유료 플랜별 polling 전략 문서화
- [x] API 쿼터 초과 시 앱이 깨지지 않음

**적용 내용**

- 스코어/상태/이벤트 API 응답은 서버에서 기본 300초 TTL로 캐시한다.
- 라인업 API 응답은 서버에서 기본 1800초 TTL로 캐시한다.
- 브라우저 polling 간격은 `NEXT_PUBLIC_LIVE_POLL_INTERVAL_SECONDS`로 조정 가능하며 기본값은 60초, 최소값은 10초다.
- B안 운영 기준에서는 `FOOTBALL_API_KEY`를 비워 공식 API 자동 연동을 끄고 Firebase 수동 입력을 메인으로 사용한다.
- 보조 공식 API를 켠 경우 기본 설정 기준 공식 API 호출량은 경기 2시간 동안 대략 다음과 같다.
  - 스코어/상태: 24회
  - 이벤트: 24회
  - 라인업: 4회
  - 총 약 52회
- 무료 100 req/day 플랜에서도 한 경기 보조 연동은 가능하지만, 경기 당일 장애/쿼터 리스크를 줄이기 위해 수동 Firebase 입력 fallback을 기본 운영 방식으로 둔다.
- API-Football 장애/쿼터 오류 시 `/api/match/live`는 200 응답의 `available=false`로 내려주고 UI는 Firebase 수동 입력 데이터로 fallback한다.

---

### 6. 라인업 UI 추가

**문제**  
API-Football에서 라인업 데이터를 가져올 수 있지만, 현재 화면에는 라인업 UI가 없다.

**작업**

- 선발 명단 표시
- 벤치 명단 표시
- 포메이션 표시
- compact 모드에서는 숨기거나 요약 표시

**관련 파일**

- `components/game/LiveMatchPanel.tsx`
- `types/match.ts`

**완료 기준**

- 공식 API 응답의 `lineups`가 화면에 표시됨
- 라인업이 없을 때 빈 상태 메시지 표시

---

### 7. 결과 공개 정책 정리

**문제**  
결과 공개 전 순위/상세 예측을 어느 수준까지 보여줄지 정책이 필요하다.

**결정 필요**

- 경기 전 전체 예측 공개 여부
- 하프타임 이후 예측 공개 여부
- 최종 결과 입력 전 순위 공개 여부
- 다른 사람의 상세 예측 조회 허용 여부

**관련 파일**

- `app/(participant)/standings/page.tsx`
- `app/(participant)/result/page.tsx`
- Firestore Security Rules

**완료 기준**

- 공개 정책 문서화
- UI와 Security Rules가 같은 정책을 적용

---

## P2. 코드/저장소 정리

### 8. `tsconfig.tsbuildinfo` Git 추적 제거

**문제**  
`tsconfig.tsbuildinfo`가 Git에 추적되고 있다. 빌드/타입체크 후 자동으로 수정되므로 커밋 노이즈가 발생한다.

**작업**

```bash
git rm --cached tsconfig.tsbuildinfo
```

`.gitignore`에 추가:

```gitignore
*.tsbuildinfo
```

**완료 기준**

- 빌드 후 `git status`에 `tsconfig.tsbuildinfo`가 나타나지 않음

---

### 9. `.gitignore`의 `.env.example` 예외 처리

**문제**  
현재 `.gitignore`에 `.env*`가 있어 `.env.example`까지 무시될 수 있다. 예제 환경변수 파일은 저장소에 남기는 것이 좋다.

**현재 관련 내용**

```gitignore
.env
.env.local
.env.*.local
.env*
```

**권장 수정**

```gitignore
.env
.env.local
.env.*.local
!.env.example
```

또는 `.env*`를 제거하고 필요한 패턴만 명시한다.

**완료 기준**

- `.env.example`은 Git에 포함됨
- 실제 `.env`, `.env.local` 등 비밀값 파일은 Git에서 제외됨

---

### 10. 정식 테스트 프레임워크 도입 검토

**문제**  
현재는 의존성을 늘리지 않기 위해 간단한 TypeScript 테스트 러너를 사용한다. 장기적으로는 Vitest 같은 정식 테스트 프레임워크가 유지보수에 유리하다.

**작업**

- Vitest 도입 여부 결정
- scoring, tiebreaker, football API parser 테스트 이전
- CI에서 `npm test`, `npx tsc --noEmit`, `npm run build` 실행

**관련 파일**

- `scripts/run-ts-test.cjs`
- `tests/*.test.ts`
- `package.json`

**완료 기준**

- 테스트 실행 방식 문서화
- CI 또는 배포 전 검증 명령 확정

---

## P3. 도메인 모델 개선

### 11. 하프타임 수정 전 원본 예측 보존

**문제**  
현재는 하프타임 수정 전 원본 예측과 수정 예측이 명확히 분리 저장되지 않는다. 따라서 “하프타임 수정 없이 경기 전 예측값으로 더 높은 점수” 같은 세밀한 정책을 정확히 계산하기 어렵다.

**작업**

- 원본 예측과 하프타임 수정 예측 저장 구조 분리
- scoring 계산에서 원본/수정본을 명확히 구분
- 타이브레이커 정책 재검증

**관련 파일**

- `types/prediction.ts`
- `types/result.ts`
- `lib/firebase/predictions.ts`
- `lib/scoring/calculator.ts`
- `lib/scoring/tiebreaker.ts`

**완료 기준**

- 원본 예측 보존
- 하프타임 수정 내역 추적 가능
- 관련 테스트 추가

---

### 12. `mexico*` 변수명 일반화

**문제**  
1차전 체코, 2차전 멕시코를 모두 지원하지만 일부 변수명이 `mexico*`로 고정되어 있다. 장기적으로 `away*` 또는 match-specific 모델이 더 적합하다.

**작업**

- `mexicoScore` → `awayScore` 전환 검토
- 기존 Firestore 데이터 마이그레이션 필요 여부 확인
- UI 라벨과 내부 필드명 분리

**관련 파일/영역**

- `lib/firebase/matchState.ts`
- `components/game/LiveMatchPanel.tsx`
- `app/admin/live/page.tsx`
- scoring/result 관련 타입

**완료 기준**

- 체코전/멕시코전 모두 자연스럽게 동작
- 기존 데이터 호환성 확보

---

## 권장 작업 순서

1. Firestore Security Rules 작성
2. 관리자 인증 강화
3. 경기 상태별 write 제한 적용
4. 실시간 API key/fixture ID 설정 및 실제 응답 검증
5. API 요청량 최적화
6. 라인업 UI 추가
7. `.gitignore`, `tsconfig.tsbuildinfo` 정리
8. 결과 공개 정책 확정
9. 테스트 프레임워크/CI 정리
10. 도메인 모델 리팩토링

---

## 기본 검증 명령

작업 후 아래 명령을 실행한다.

```bash
npm test
npx tsc --noEmit
npm run build
```

빌드 후 `tsconfig.tsbuildinfo`가 변경되면, 추적 제거 작업 전까지는 다음으로 되돌린다.

```bash
git checkout -- tsconfig.tsbuildinfo
```
