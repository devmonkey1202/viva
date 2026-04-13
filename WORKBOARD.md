# 작업 보드

현재 구현 상태, 남은 작업, 제출 리스크를 한 곳에서 관리한다.

## 현재 상태

- 제품명 `VIVA` 고정
- 제품 방향 `제출 이후 이해 검증 레이어` 고정
- 공개 production domain 확보
  - `https://viva-rho-seven.vercel.app`
- 주요 페이지 구현
  - `/`
  - `/login`
  - `/teacher`
  - `/teacher/verifications/[verificationId]`
  - `/operator`
  - `/settings`
  - `/student/[verificationId]`
  - `/unauthorized`
  - `/session-expired`
- 주요 API 구현
  - `/api/health`
  - `/api/questions`
  - `/api/analyze`
  - `/api/teacher-decisions`
  - `/api/verifications`
  - `/api/verifications/[verificationId]`
  - `/api/verifications/[verificationId]/student-access`
  - `/api/summary`
  - `/api/export`
  - `/api/auth/login`
  - `/api/auth/logout`
- 저장 구조 구현
  - 로컬 JSON 저장
  - Neon/Postgres 저장
- AI 구조 구현
  - OpenAI 호출 경로
  - mock fallback
  - structured JSON 응답
  - fallback reason 기록
- 학생 입력 구현
  - 텍스트 답변
  - STT(Web Speech API)
  - 텍스트 fallback
  - 전사 메타 저장
- 교사 편의 기능 구현
  - 초안 자동 저장
  - 이탈 경고
  - 최근 세션 검색/재오픈
  - 세션 상세 페이지
  - 학생 링크 잠금/재개방
  - 현재 세션 단건 JSON export
  - 현재 답변 재분석
- 자동 검증 구현
  - `npm run lint`
  - `npm run test:unit`
  - `npm run build`
  - `npm run smoke:http`
  - `npm run smoke:live`
  - `npm run smoke:url`
  - `npm run verify`
- GitHub Actions CI 구성

## 현재 정상 동작 범위

- 교사가 과제와 루브릭을 입력할 수 있다
- 질문 3개를 생성할 수 있다
- 학생 링크를 발급할 수 있다
- 학생이 텍스트 또는 음성(STT)로 답변할 수 있다
- 제출물, 질문, 답변, 루브릭을 기준으로 분석할 수 있다
- 교사가 근거를 보고 최종 판단을 저장할 수 있다
- 운영자가 분포와 반복 오개념을 볼 수 있다
- JSON/CSV export가 된다
- 특정 세션만 JSON으로 내보낼 수 있다
- 학생 링크를 잠그고 다시 열 수 있다
- 최근 세션을 검색하고 다시 불러올 수 있다
- health check가 된다

## 현재 리스크

- production에서 실제 OpenAI 호출은 크레딧 충전 전까지 `mock-engine` fallback이다
- AI 리포트는 아직 초안 단계다
- 제출용 PDF 세트가 아직 없다
- 디자인 전면 재설계가 아직 남아 있다

## 다음 우선순위

1. 최신 커밋이 production에 반영된 뒤 라이브 smoke 재검증
2. AI 리포트 본문 마감
3. 제출용 PDF 세트 정리
4. 디자인 전면 재설계

## 외부 블로커

- OpenAI 크레딧이 충전되기 전까지 production 실AI 경로는 완전 검증할 수 없다
