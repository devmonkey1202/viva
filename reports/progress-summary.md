# 진행 요약

## 2026-04-10

- 원본 문서 학습 완료
- 제품 정체성, 공모전 방향, v1 범위 고정
- 문서 구조와 저장소 기본 구조 정리
- Next.js 프로젝트 골격 생성
- 질문 생성/분석 기본 API 구현 시작

## 2026-04-11

- Git 저장소 초기화와 원격 연결
- 브랜드명 `VIVA` 확정
- 교사, 운영자, 학생 surface 분리
- JSON 저장과 Neon 저장 경로 구현
- 교사 판단, export, 운영자 요약 구현
- OpenAI 연결과 mock fallback 구조 구현

## 2026-04-13

- OpenAI Responses API 기준 호출 구조 정리
- `gpt-5-nano` 호출 확인
- 학생 STT(Web Speech API)와 텍스트 fallback 구현
- 학생 답변 메타 저장 구현
- 교사 화면에서 학생 답변과 전사 메타 검토 가능하게 보강
- 공통 런타임 설정, 공통 API 에러 처리 정리
- `smoke-http`, `smoke:url`, `verify` 스크립트 정리
- mock/live 경로를 분리한 smoke 테스트 구성
- GitHub Actions CI 추가
- teacher/student 도메인 로직 분리와 단위 테스트 추가
- 최근 세션 목록 API와 세션 브라우저 추가
- 교사 초안 자동 저장, 이탈 경고, 세션 상태 필터 추가
- 로그인, 설정, 세션 상세, 권한 없음/만료 페이지 추가
- 학생 링크 잠금/재개방, 현재 세션 export, 재분석 기능 추가
- Vercel production domain 확인
- GDWEB 작품 학습 기준으로 [design-blueprint.md](/C:/Users/주원/Desktop/gongmo/docs/design-blueprint.md) 추가

## 현재 판단

- 기능 구현 범위는 충분히 올라왔다
- 로컬 검증 흐름은 안정적이다
- production 공개 URL도 확보됐다
- 다만 production 실AI는 크레딧 문제로 아직 fallback 상태다
- 다음 핵심은 디자인 구현, AI 리포트 마감, 제출 PDF 세트 정리다
