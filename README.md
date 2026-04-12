# VIVA

VIVA는 AI 시대 교육 현장에서 학생의 결과물만이 아니라 `실제 이해`를 검증하기 위한 평가 검증 레이어입니다.

이 프로젝트는 LMS도, AI 튜터도, AI 탐지기도 아닙니다.  
핵심은 `제출 이후`, 학생 제출물과 루브릭을 바탕으로 학생별 질문을 만들고, 학생 답변과 제출물 사이의 정합성을 분석해 교사가 최종 판단할 수 있게 만드는 것입니다.

## 제품 정의

- 대상 사용자: 교강사, 학생, 교육 운영자
- 핵심 흐름:
  1. 교사가 과제, 루브릭, 제출물을 입력한다.
  2. AI가 학생별 검증 질문 3개를 생성한다.
  3. 학생이 텍스트 또는 음성으로 답변한다.
  4. 시스템이 제출물, 질문, 답변, 루브릭을 함께 분석한다.
  5. 교사가 근거를 검토하고 최종 판단을 저장한다.
  6. 운영자가 반복 오개념과 패턴을 확인한다.

## 공모전 기준

- 주제: `AI활용 차세대 교육 솔루션`
- 제출 기한: `2026-04-13`
- 필수 제출물:
  - public GitHub 저장소
  - 배포 URL
  - AI 리포트 PDF
  - 개인정보 수집 및 이용 동의서 PDF
  - 참가 각서 PDF

상세 기준은 [gongmo.md](C:/Users/주원/Desktop/gongmo/gongmo.md), [title.md](C:/Users/주원/Desktop/gongmo/title.md), [PROJECT_RULES.md](C:/Users/주원/Desktop/gongmo/PROJECT_RULES.md)를 우선으로 봅니다.

## 저장소 구조

- [WORKBOARD.md](C:/Users/주원/Desktop/gongmo/WORKBOARD.md): 현재 상태와 남은 일
- [docs/README.md](C:/Users/주원/Desktop/gongmo/docs/README.md): 기준 문서 인덱스
- [reports/progress-summary.md](C:/Users/주원/Desktop/gongmo/reports/progress-summary.md): 진행 요약
- [reports/ai-report-draft.md](C:/Users/주원/Desktop/gongmo/reports/ai-report-draft.md): AI 리포트 초안
- [apps/web](C:/Users/주원/Desktop/gongmo/apps/web): 실제 웹 앱

## 현재 구현 상태

- teacher / student / operator 화면 구현
- 질문 생성, 분석, 교사 판단, export, summary API 구현
- OpenAI 연동 및 mock fallback 구현
- Neon/Postgres 저장 경로와 로컬 파일 저장 경로 구현
- Web Speech API 기반 STT + 텍스트 fallback 구현
- `lint + unit test + build + smoke test` 자동 검증 구현

## 현재 남은 일

1. Vercel 배포
2. 배포 환경 기준 재검증
3. AI 리포트 최종 본문 작성 및 PDF 변환
4. 제출 서류 최종 정리
5. 디자인 전면 재설계
