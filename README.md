# VIVA

> 제출은 끝났고, 이해는 아직 확인되지 않았습니다.

VIVA는 학생의 결과물 자체를 의심하는 서비스가 아니라, **제출 이후 학생이 실제로 이해했는지 다시 확인하는 평가 검증 레이어**입니다.  
과제, 루브릭, 제출물을 바탕으로 학생별 검증 질문을 만들고, 답변과 제출물의 정합성을 비교해 **교사가 근거 중심으로 최종 판단**할 수 있게 돕습니다.

## 빠른 링크

- 라이브 서비스: [viva-rho-seven.vercel.app](https://viva-rho-seven.vercel.app)
- 로그인: [viva-rho-seven.vercel.app/login](https://viva-rho-seven.vercel.app/login)
- 교사용 워크스페이스: [viva-rho-seven.vercel.app/teacher](https://viva-rho-seven.vercel.app/teacher)
- 운영 화면: [viva-rho-seven.vercel.app/operator](https://viva-rho-seven.vercel.app/operator)
- 문서 인덱스: [docs/README.md](./docs/README.md)

## 한눈에 보기

| 항목 | 내용 |
|---|---|
| 제품 정의 | AI 시대의 제출 이후 이해 검증 서비스 |
| 1차 사용자 | 교사 |
| 2차 사용자 | 학생 |
| 3차 사용자 | 교육 운영자 |
| 핵심 입력 | 과제, 루브릭, 제출물 |
| 핵심 출력 | 학생별 질문, 분석 근거, 교사 최종 판단, 반복 오개념 요약 |

## 해결하려는 문제

AI 사용이 자연스러워진 환경에서, 제출물만으로는 학생의 실제 이해를 확인하기 어렵습니다.

- 결과물은 잘 보이지만 이해는 비어 있을 수 있습니다.
- AI 탐지기는 정답이 아니라 의심만 남깁니다.
- 교사는 직접 다시 묻고 싶지만, 매번 개별 구술 검증을 하기 어렵습니다.

VIVA는 이 지점을 해결합니다.  
**학생마다 다른 질문을 만들고, 답변과 제출물을 함께 비교해, 교사가 빠르게 판단할 수 있는 근거 구조를 제공합니다.**

## 이것은 무엇이 아닌가

- LMS가 아닙니다.
- AI 튜터가 아닙니다.
- AI 탐지기가 아닙니다.
- 자동 채점기가 아닙니다.

## 주요 기능

### 1. 학생별 검증 질문 생성
- 과제, 루브릭, 제출물을 함께 읽고 학생별 질문 3개를 생성합니다.
- 질문은 단순 요약 확인이 아니라, 설명 구조와 이해 수준을 다시 확인하는 방향으로 설계합니다.

### 2. 텍스트 + 음성 답변 수집
- 학생은 텍스트로 답하거나 브라우저 STT를 통해 음성으로 답할 수 있습니다.
- STT가 지원되지 않는 환경에서는 텍스트 입력으로 자연스럽게 fallback 됩니다.

### 3. 제출물-질문-답변-루브릭 비교 분석
- 시스템은 제출물, 질문, 답변, 루브릭을 함께 비교합니다.
- 빠진 개념, 충돌 지점, 설명 실패 가능성을 구조화합니다.

### 4. 교사 최종 판단
- 점수를 자동 확정하지 않습니다.
- 교사는 근거를 검토한 뒤 최종 판단을 저장합니다.

### 5. 운영자용 반복 패턴 요약
- 분류 분포, 반복 오개념, 누락 개념, 최근 세션을 확인할 수 있습니다.
- 수업 개선이 필요한 지점을 운영 화면에서 빠르게 읽을 수 있습니다.

## 핵심 흐름

1. 교사가 과제, 루브릭, 제출물을 입력합니다.
2. VIVA가 학생별 검증 질문 3개를 생성합니다.
3. 학생이 텍스트 또는 음성으로 답합니다.
4. 시스템이 제출물, 질문, 답변, 루브릭을 함께 비교합니다.
5. 교사가 근거를 보고 최종 판단을 저장합니다.
6. 운영자가 반복 패턴과 오개념을 확인합니다.

## 왜 VIVA인가

- **학생별 질문**: 모든 학생에게 같은 질문을 던지지 않습니다.
- **근거 우선**: 점수보다 빠진 개념과 충돌 지점을 먼저 보여줍니다.
- **교사 중심**: 자동 판정으로 끝내지 않고 교사가 책임 있게 마감합니다.
- **실서비스형 구현**: 질문 생성, 분석, 세션 저장, STT, 운영 화면, export까지 실제 흐름을 갖춥니다.

## 제품 화면

| Surface | 역할 |
|---|---|
| `/` | 제품 소개, 문제 정의, 핵심 흐름 |
| `/login` | 교사/운영자 진입 |
| `/teacher` | 질문 생성, 학생 링크, 분석 검토, 교사 판단 |
| `/teacher/verifications/[verificationId]` | 세션 상세 검토 |
| `/student/[verificationId]` | 학생 답변 제출 |
| `/operator` | 분포, 반복 오개념, 최근 세션 |
| `/settings` | 기본 정책과 런타임 설정 확인 |

## 기술 구성

| 영역 | 사용 기술 |
|---|---|
| Web | Next.js, React, TypeScript |
| Validation | Zod |
| AI | OpenAI Responses API |
| Storage | Neon Postgres, file fallback |
| STT | Web Speech API |
| Deploy | Vercel |
| Quality | lint, unit test, smoke test, CI |

## AI 설계

- 질문 생성과 분석을 분리했습니다.
- 출력은 자유 텍스트가 아니라 구조화된 JSON으로 검증합니다.
- 실AI가 실패하면 fallback 경로를 기록합니다.
- 학생 답변은 텍스트/STT 메타와 함께 저장됩니다.

## 보안과 운영

- 서명된 세션 쿠키를 사용합니다.
- 교사/운영자 API는 서버에서 역할을 다시 검증합니다.
- 학생 페이지에는 필요한 범위의 데이터만 내려갑니다.
- health endpoint는 최소 정보만 공개합니다.

## 로컬에서 실행하기

```bash
cd apps/web
npm install
npm run dev
```

기본 주소:

- `http://localhost:3000`
- 교사: `http://localhost:3000/teacher`
- 운영: `http://localhost:3000/operator`

## 환경 변수

루트가 아니라 `apps/web/.env.local` 기준입니다.

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

설명:

- `AI_API_KEY`: OpenAI API 키
- `DATABASE_URL`: Neon Postgres 연결 문자열
- `VIVA_SESSION_SECRET`: production 세션 서명 키
- `VIVA_TEACHER_ACCESS_CODE`, `VIVA_OPERATOR_ACCESS_CODE`: 필요할 때만 쓰는 선택적 접근 코드

## 검증 명령

```bash
cd apps/web
npm run lint
npm run test:unit
npm run build
npm run smoke:http
npm run smoke:live
npm run verify
```

## 저장소 안내

- [gongmo.md](./gongmo.md): 공모전 요구사항 요약
- [title.md](./title.md): 제품 방향과 원안
- [PROJECT_RULES.md](./PROJECT_RULES.md): 프로젝트 운영 기준
- [docs/README.md](./docs/README.md): 문서 인덱스
- [reports/progress-summary.md](./reports/progress-summary.md): 진행 요약
- [reports/ai-report-draft.md](./reports/ai-report-draft.md): AI 리포트 초안
- [apps/web](./apps/web): 실제 웹 서비스 코드

## 대회 제출 참고

공모전 기준으로 이 저장소는 아래 자료를 함께 관리합니다.

- 제품 코드
- 문서화 자료
- AI 설계 기록
- 작업 기록
- 제출용 서류 초안

공모전 원문 기준은 [gongmo.md](./gongmo.md), [title.md](./title.md), [PROJECT_RULES.md](./PROJECT_RULES.md)를 우선으로 따릅니다.
