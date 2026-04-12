# 작업 보드

현재 구현 상태, 남은 일, 제출 리스크를 한 곳에서 보기 위한 실행 보드다.

## 현재 상태

- 제품명 `VIVA` 고정
- 제품 방향 `제출 이후 이해 검증 레이어` 고정
- 공개 production domain 확인
  - `https://viva-rho-seven.vercel.app`
- 주요 페이지 구현
  - `/`
  - `/teacher`
  - `/operator`
  - `/student/[verificationId]`
- 주요 API 구현
  - `/api/health`
  - `/api/questions`
  - `/api/analyze`
  - `/api/teacher-decisions`
  - `/api/verifications`
  - `/api/verifications/[verificationId]`
  - `/api/summary`
  - `/api/export`
- 저장 구조 구현
  - 로컬 JSON 저장
  - Neon/Postgres 저장 어댑터
- AI 구조 구현
  - OpenAI 연결 경로
  - mock fallback
  - structured JSON 응답
  - fallback reason 기록
- 학생 음성 답변 구현
  - Web Speech API
  - 텍스트 fallback
  - 전사 메타 저장
- 교사용 최근 세션 브라우저 구현
  - 세션 검색
  - 세션 재오픈
- 자동 검증 구현
  - `npm run lint`
  - `npm run test:unit`
  - `npm run build`
  - `npm run smoke:http`
  - `npm run smoke:live`
  - `npm run smoke:url`
  - `npm run verify`
- GitHub Actions CI 추가

## 현재 정상 동작으로 보는 범위

- 교사가 과제와 루브릭을 입력할 수 있다
- 학생 제출물을 등록할 수 있다
- 질문 3개를 생성할 수 있다
- 학생 링크를 발급할 수 있다
- 학생이 텍스트 또는 음성 기반으로 답변할 수 있다
- 분석 결과를 생성하고 저장할 수 있다
- 교사가 학생 답변, 전사 메타, 분석 근거를 함께 볼 수 있다
- 교사가 최종 판단을 저장할 수 있다
- 교사가 최근 세션을 다시 불러올 수 있다
- 운영자가 분포와 패턴을 볼 수 있다
- JSON/CSV export가 가능하다
- 로컬과 배포 환경에서 health check가 가능하다

## 현재 리스크

- production에서 OpenAI 크레딧 문제로 실제 AI 호출이 막히면 `mock-engine` fallback으로 동작한다
- AI 리포트는 아직 초안 단계다
- 제출용 PDF 세트가 아직 없다
- 디자인 전면 재설계가 남아 있다
- 로그인, 설정, 세션 상세 페이지는 아직 라우트 수준에서 분리되지 않았다

## 방금 고정한 정보구조 기준

- 공개 페이지는 `/` 하나로 밀도 있게 정리한다
- 교사와 운영자는 로그인 필요 surface로 분리한다
- 학생은 링크 기반 진입을 기본값으로 둔다
- 설정은 `/settings` 독립 페이지로 둔다
- 이후 추가할 핵심 페이지
  - `/login`
  - `/settings`
  - `/teacher/verifications/[verificationId]`
  - 권한 없음 / 만료 상태 페이지

## 다음 우선순위

1. production 전체 흐름 재검증
2. 로그인 / 설정 / 세션 상세 페이지 구조 설계 반영
3. AI 리포트 본문 마감
4. 제출용 PDF 세트 정리
5. 디자인 전면 재설계

## 외부 블로커

- OpenAI 크레딧이 충전되기 전까지 production의 실제 AI 경로는 완전 검증할 수 없다

