# 진행 요약

## 2026-04-10

- 원본 문서 학습 완료
- 제품 정체성, 공모전 방향, v1 범위 고정
- 문서 구조와 저장소 기준 정리
- Next.js 웹 앱 골격 생성
- 질문 생성/분석 기본 API 구현

## 2026-04-11

- Git 저장소 초기화 및 원격 연결
- 브랜드명 `VIVA` 확정
- 교사/운영자/학생 화면 분리
- JSON 저장 + Neon 저장 경로 구현
- 교사 판단, export, 운영자 요약 구현
- OpenAI 연결 + mock fallback 구조 구현

## 2026-04-13

- OpenAI Responses API 구조화 출력 안정화
- `gpt-5-nano` 실호출 확인
- 학생 화면 STT(Web Speech API) + 텍스트 fallback 구현
- 학생 답변 메타 저장 구현
- 교사 화면에서 학생 답변/전사 메타 검토 가능하도록 보강
- 런타임 설정 공통화
- API 에러 처리 공통화
- 자동 스모크 테스트 `scripts/smoke-http.mjs` 추가
- mock 경로와 live 경로를 분리한 스모크 테스트 구성
- GitHub Actions CI 추가
- teacher/student 핵심 로직을 순수 함수와 서브컴포넌트로 분해
- 단위 테스트 추가
- 검증 세션 목록 API 추가
- 교사용 최근 세션 브라우저 추가
- mock fallback reason 기록 추가
- Vercel production domain 확인

## 현재 판단

- 기능 구현 완성도는 높다.
- 자동 검증과 재현 가능성은 이전보다 좋아졌다.
- 배포는 살아 있지만 production AI는 아직 fallback 상태다.
- 아직 AI 리포트 최종본, 제출용 PDF 세트, 디자인 마감이 남아 있다.
