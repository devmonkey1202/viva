# VIVA 웹 앱

이 디렉터리는 VIVA의 실제 배포 대상 웹 앱이다.

현재 구현된 범위:

- 랜딩 페이지 `/`
- 교사 워크벤치 `/teacher`
- 운영자 요약 `/operator`
- 질문 생성 API `/api/questions`
- 이해 분석 API `/api/analyze`
- 교사 판단 저장 API `/api/teacher-decisions`
- export API `/api/export`
- 요약 API `/api/summary`
- OpenAI 연결 가능 구조 + mock fallback
- JSON 기반 로컬 저장 계층

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 연다.

## 환경 변수

`.env.example`을 참고해 `.env.local`을 만든다.

```bash
AI_API_KEY=
AI_FAST_MODEL=gpt-5.2
AI_REASONING_MODEL=gpt-5.2
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_RETRIES=1
DATABASE_URL=
```

API 키가 없으면 앱은 자동으로 mock fallback 모드로 동작한다.

- `DATABASE_URL`이 없으면 질문 생성, 분석, 교사 판단 결과는 `data/verification-store.json`에 저장된다.
- `DATABASE_URL`이 있으면 Neon/Postgres 저장소를 사용한다.
- 로컬 JSON 저장 파일은 Git에 포함되지 않는다.

## 검증

```bash
npm run lint
npm run build
```

## 현재 구조

- `src/app`
  페이지와 API 라우트
- `src/components`
  UI 컴포넌트
- `src/lib`
  스키마, 데모 데이터, AI 서비스, 저장 계층

## 다음 작업

- AI service adapter 고도화
- 관리형 DB 어댑터 준비
- 배포 설정 완료
