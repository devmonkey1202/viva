# VIVA Web

이 디렉터리는 VIVA의 실제 웹 서비스 코드입니다.

## 포함 범위

- 공개 랜딩 페이지 `/`
- 로그인 `/login`
- 교사용 워크스페이스 `/teacher`
- 교사용 세션 상세 `/teacher/verifications/[verificationId]`
- 학생 답변 화면 `/student/[verificationId]`
- 운영 화면 `/operator`
- 설정 화면 `/settings`
- 상태 화면 `/unauthorized`, `/session-expired`

## 핵심 기능

- 학생별 검증 질문 생성
- 제출물-질문-답변-루브릭 비교 분석
- 교사 최종 판단 저장
- 운영자용 반복 패턴 요약
- Web Speech API 기반 STT + 텍스트 fallback
- OpenAI 실AI 경로 + mock fallback
- Neon/Postgres 저장 + 파일 저장 fallback
- 첫 진입 코치마크 튜토리얼

## 실행

```bash
npm install
npm run dev
```

기본 주소:

- `http://localhost:3000`
- 교사: `http://localhost:3000/teacher`
- 운영: `http://localhost:3000/operator`

## 환경 변수

`.env.example`를 참고해 `.env.local`을 만듭니다.

```env
AI_API_KEY=
AI_FAST_MODEL=gpt-5-nano
AI_REASONING_MODEL=gpt-5-nano
AI_REQUEST_TIMEOUT_MS=45000
AI_MAX_RETRIES=1
DATABASE_URL=
VIVA_SESSION_SECRET=
VIVA_TEACHER_ACCESS_CODE=
VIVA_OPERATOR_ACCESS_CODE=
VERIFICATION_STORE_PATH=
```

### 설명

- `AI_API_KEY`: OpenAI API 키
- `AI_FAST_MODEL`: 질문 생성용 기본 모델
- `AI_REASONING_MODEL`: 분석용 기본 모델
- `AI_REQUEST_TIMEOUT_MS`: AI 요청 타임아웃
- `AI_MAX_RETRIES`: AI 재시도 횟수
- `DATABASE_URL`: Neon Postgres 연결 문자열
- `VIVA_SESSION_SECRET`: production 세션 서명 키
- `VIVA_TEACHER_ACCESS_CODE`, `VIVA_OPERATOR_ACCESS_CODE`: 선택적 접근 코드
- `VERIFICATION_STORE_PATH`: 로컬 파일 저장 경로

## Vercel 권장 설정

```env
AI_API_KEY=
AI_FAST_MODEL=gpt-5-nano
AI_REASONING_MODEL=gpt-5-nano
AI_REQUEST_TIMEOUT_MS=45000
AI_MAX_RETRIES=1
DATABASE_URL=
VIVA_SESSION_SECRET=
VIVA_TEACHER_ACCESS_CODE=
VIVA_OPERATOR_ACCESS_CODE=
```

메모:

- `VIVA_SESSION_SECRET`은 production에서 필수입니다.
- 접근 코드는 심사 편의를 위해 비워둘 수 있습니다.
- `DATABASE_URL`이 있으면 Neon/Postgres를 사용하고, 없으면 파일 저장 fallback을 사용합니다.
- STT는 브라우저 Web Speech API를 사용하며, 지원되지 않는 환경에서는 텍스트 입력으로 동작합니다.

## 검증

```bash
npm run lint
npm run test:unit
npm run build
npm run smoke:http
npm run smoke:live
npm run smoke:url -- --base-url=https://example.vercel.app
npm run verify
```

### 검증 의미

- `smoke:http`: mock AI + 로컬 저장 기준 핵심 HTTP 흐름 검증
- `smoke:live`: `.env.local` 기준 실AI + 실DB 검증
- `smoke:url`: 배포 URL 기준 원격 스모크 검증
- `verify`: `lint + test:unit + build + smoke:http`

## 주요 디렉터리

- `src/app`: 페이지와 API 라우트
- `src/components`: UI 컴포넌트
- `src/lib`: 인증, 저장소, AI, 스키마, 상태 관리
- `scripts`: 스모크 테스트 스크립트

## 참고 문서

- [../../README.md](../../README.md)
- [../../docs/README.md](../../docs/README.md)
- [../../docs/system-architecture.md](../../docs/system-architecture.md)
- [../../docs/design-blueprint.md](../../docs/design-blueprint.md)
