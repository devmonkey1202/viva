# 진행 요약

## 2026-04-10

- done:
  원본 문서 전수 확인
  대회 기준 정리
  프로젝트 정체성 고정
  공모전 제출형 v1 기준 확정
  아키텍처/도메인/클린 코드/안전장치/제출 운영 문서화
  실행용 작업 보드/로드맵/기능 명세/진행 관리 문서 추가
  AI 개발 마스터 플랜/품질 평가/런타임 배포 문서 추가
  질문 생성/답변 분석 프롬프트 v1 초안 작성
  AI 출력 스키마 v1 초안 작성
  샘플 루브릭/제출물/답변 데이터 초안 작성
  Next.js 기반 웹 앱 생성
  랜딩 페이지 구현
  교사 워크벤치 구현
  질문 생성 API 구현
  분석 API 구현
  OpenAI 연결 + mock fallback 구조 구현
  lint/build 통과
- in_progress:
  실제 저장/판단/export 흐름 확장
- next:
  저장 계층 연결
  교사 최종 판단 저장
  export 구현
  운영자 요약 화면
  AI 리포트 초안 1차 보강
- risks:
  범위 과확장
  문서와 구현 불일치
  마감 직전 리포트 몰아쓰기
- docs_updated:
  README
  PROJECT_RULES
  docs/*
  WORKBOARD

## 2026-04-11

- done:
  Git 저장소 초기화
  원격 저장소 `https://github.com/devmonkey1202/viva.git` 연결
  Git 작성자 계정 `devmonkey1202 <juwon1202@icloud.com>`으로 수정
  제품 브랜드명 `VIVA` 확정
  README, 앱 메타데이터, 리포트 초안, 핵심 문서에 `VIVA` 반영
  `직접 학습` 대신 `VIVA 전용 AI 시스템 직접 구현` 전략 문서화
  decision log에 제품명/AI 전략 결정 기록
  앱 lint/build 재검증 통과
  질문 생성 시 검증 세션 저장 연결
  분석 결과 저장 연결
  교사 최종 판단 저장 API 구현
  JSON/CSV export API 구현
  운영자 요약 API 및 `/operator` 화면 구현
  교사 워크벤치에 verification id, export, 운영자 이동, 교사 판단 UI 반영
  로컬 서버 기준 실제 HTTP 흐름 검증 완료
  질문 생성 -> 분석 -> 교사 판단 -> 요약 -> export 응답 확인
  `DATABASE_URL`이 있으면 Neon/Postgres, 없으면 로컬 JSON 저장소를 쓰는 하이브리드 저장 구조 구현
  랜딩/교사/운영자 화면 전면 재디자인
  교사용 desktop-first, 운영자 desktop-first, 학생 mobile-first 기준으로 surface 구조 재설계
  학생 답변 화면 `/student/[verificationId]` 구현
  검증 세션 조회 API `/api/verifications/[verificationId]` 구현
  teacher 화면에서 학생 링크 공유, 결과 동기화, 세션 기록 확인 흐름 추가
  디자인 시스템 토큰과 공통 surface/card/button/input 규칙 정리
  로컬 서버 기준 페이지 응답과 API 흐름 재검증 완료
  프로덕션 빌드 기준 `/`, `/teacher`, `/operator`, `/student/[verificationId]`, 질문 생성, 세션 조회, 분석, 교사 판단, 요약 흐름 재검증 완료
- in_progress:
  AI service adapter 고도화
- next:
  Vercel 배포 설정 구체화
  Neon 실제 연결 검증
  AI 리포트 초안 본문 심화
- risks:
  원본 문서명과 제품 브랜드명이 혼재되어 혼동될 위험
  Neon 실배포 연결 전까지는 로컬 저장 검증 위주라는 한계
  구현 속도보다 문서가 앞서갈 위험
  사용자가 제공한 Neon REST/Data API 주소와 현재 `DATABASE_URL` 기반 어댑터가 다르므로 연결 정보 정리가 필요
- docs_updated:
  README
  WORKBOARD
  reports/progress-summary.md
  reports/ai-report-draft.md
  apps/web/README.md
  docs/project-charter.md
  docs/ai-development-master-plan.md
  docs/decision-log.md
