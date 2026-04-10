# VIVA 웹 앱

이 디렉터리는 VIVA의 실제 배포 대상 웹 앱이다.

현재 구현된 범위:

- 랜딩 페이지 `/`
- 교사 워크벤치 `/teacher`
- 질문 생성 API `/api/questions`
- 이해 분석 API `/api/analyze`
- OpenAI 연결 가능 구조 + mock fallback

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
```

API 키가 없으면 앱은 자동으로 mock fallback 모드로 동작한다.

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
  스키마, 데모 데이터, AI 서비스

## 다음 작업

- 실제 저장 계층 연결
- 교사 최종 판단 저장
- export 기능 추가
- 운영자 요약 화면 추가
- 배포 설정 완료
