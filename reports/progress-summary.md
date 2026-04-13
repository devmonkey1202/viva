# 진행 요약

## 2026-04-10

- 원본 문서 학습 완료
- 제품 정체성, 공모전 방향, v1 범위 고정
- 문서 구조와 저장소 기본 구조 정리
- Next.js 프로젝트 골격 생성
- 질문 생성/분석 기본 API 구현 시작

## 2026-04-11

- Git 저장소 초기화 및 원격 연결
- 브랜드명 `VIVA` 확정
- 교사, 운영자, 학생 surface 분리
- JSON 저장 + Neon 저장 경로 구현
- 교사 판단, export, 운영자 요약 구현
- OpenAI 연결 + mock fallback 구조 구현

## 2026-04-13

- OpenAI Responses API 기준 호출 구조 정리
- `gpt-5-nano` 호출 확인
- 학생 STT(Web Speech API) + 텍스트 fallback 구현
- 학생 답변 메타 저장 구현
- 교사 화면에서 학생 답변과 전사 메타 검토 가능하게 보강
- 공통 런타임 설정, 공통 API 에러 처리 정리
- 자동 검증 스크립트 `smoke-http` 추가
- mock/live 경로를 분리한 smoke 테스트 구성
- GitHub Actions CI 추가
- teacher/student 핵심 로직 분리와 단위 테스트 추가
- 최근 세션 목록 API와 세션 브라우저 추가
- 교사 초안 자동 저장, 이탈 경고, 세션 상태 필터 추가
- 로그인/로그아웃, 설정 페이지, 세션 상세 페이지, 권한 없음/만료 페이지 추가
- 학생 링크 잠금/재개방, 현재 세션 단건 export, 현재 답변 재분석 기능 추가
- Vercel production domain 확인

## 현재 판단

- 핵심 기능 구현 범위는 충분히 올라왔다
- 로컬 검증 신뢰도는 높다
- production 공개 URL도 확보했다
- 다만 production 실AI는 크레딧 문제로 아직 fallback 상태다
- 남은 큰 일은 AI 리포트 마감, 제출 PDF 세트, 디자인 재설계다
