# VIVA 웹 앱

이 디렉터리는 VIVA의 실제 배포 대상 웹 앱입니다.

현재 구현된 범위:

- 랜딩 페이지 `/`
- 교사 워크벤치 `/teacher`
- 운영자 요약 `/operator`
- 학생 답변 화면 `/student/[verificationId]`
- 상태 점검 API `/api/health`
- 브라우저 STT(Web Speech API) + 텍스트 fallback
- 질문 생성 API `/api/questions`
- 이해 분석 API `/api/analyze`
- 교사 판단 저장 API `/api/teacher-decisions`
- 검증 세션 조회 API `/api/verifications/[verificationId]`
- export API `/api/export`
- 요약 API `/api/summary`
- OpenAI 연결 가능 구조 + mock fallback
- 로컬 JSON 저장 + Neon/Postgres 저장 하이브리드 계층
- 학생 답변은 `inputMethod`, `rawTranscript`, `normalizationNotes` 메타와 함께 저장 가능
- 자동 스모크 테스트와 GitHub Actions CI

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경 변수

`.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
AI_API_KEY=
AI_FAST_MODEL=gpt-5.2
AI_REASONING_MODEL=gpt-5.2
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_RETRIES=1
VIVA_SESSION_SECRET=
VIVA_TEACHER_ACCESS_CODE=
VIVA_OPERATOR_ACCESS_CODE=
DATABASE_URL=
VERIFICATION_STORE_PATH=
```

- `AI_API_KEY`가 없으면 앱은 자동으로 mock fallback 모드로 동작합니다.
- `VIVA_SESSION_SECRET`은 서명된 세션 쿠키에 사용합니다. 배포에서는 반드시 설정하는 편이 안전합니다.
- `VIVA_TEACHER_ACCESS_CODE`, `VIVA_OPERATOR_ACCESS_CODE`를 설정하면 역할별 접속 코드가 필요합니다.
- `DATABASE_URL`이 없으면 질문 생성, 분석, 교사 판단 결과는 로컬 저장소에 기록됩니다.
- `DATABASE_URL`이 있으면 Neon/Postgres 저장소를 사용합니다.
- 현재 저장 어댑터는 Neon REST/Data API 주소가 아니라 Postgres 연결 문자열(`DATABASE_URL`)을 기대합니다.
- `VERIFICATION_STORE_PATH`는 테스트나 로컬 검증에서 저장 파일 경로를 분리할 때만 사용합니다.
- STT는 브라우저 Web Speech API를 사용합니다. 지원되지 않는 브라우저에서는 텍스트 입력 fallback이 기본 동작입니다.

## 검증

```bash
npm run lint
npm run build
npm run smoke:http
npm run smoke:live
npm run verify
```

- `smoke:http`는 mock AI + 파일 저장 모드에서 핵심 HTTP 흐름을 자동 검증합니다.
- `smoke:live`는 `.env.local` 기준 실AI + 실DB 경로를 스모크 테스트합니다.
- `verify`는 `lint -> build -> smoke:http`를 한 번에 실행합니다.

## 현재 구조

- `src/app`
  페이지와 API 라우트
- `src/components`
  UI 컴포넌트
- `src/lib`
  스키마, 데모 데이터, AI 서비스, 저장 계층, 런타임 설정
- `scripts`
  자동 검증 스크립트

## 다음 작업

- AI service adapter 고도화
- Vercel 배포 설정 완료
- 최종 AI 리포트 본문 보강
