# VIVA

VIVA는 AI 시대의 교육 현장에서, 결과물만으로는 확인하기 어려운 학생의 "진짜 이해"를 제출물 기반의 짧은 검증으로 증명하게 만드는 평가 검증 인프라다.

현재 이 저장소는 배포 가능한 공모전 제출형 v1을 실제로 구현하는 저장소다. 문제정의, 대회 제약, 아키텍처, 클린 코드 규칙, AI 운용 원칙을 문서로 고정한 뒤 웹 앱과 AI 검증 흐름을 함께 발전시킨다.

## 프로젝트 정체성

- 이것은 LMS가 아니다.
- 이것은 AI 튜터가 아니다.
- 이것은 AI 탐지기가 아니다.
- 이것은 제출 이후의 검증 레이어다.
- 핵심 사용자는 교강사이며, 학생과 교육 운영자가 그 다음 사용자다.

## 대회 핵심 사실

- 공모전 주제: `AI활용 차세대 교육 솔루션`
- 최종 제출 기한: `2026-04-13`
- 필수 제출물: `public GitHub 저장소`, `배포 URL`, `AI 리포트 PDF`, `개인정보 수집/이용 동의서 PDF`, `참가 각서 PDF`
- 주의사항: `2026-04-13` 이후 커밋은 부정행위로 간주될 수 있으므로 내부 동결 시점을 더 앞당겨야 한다.

## 지금 당장 지켜야 할 규칙

- 공모전 제출물은 장난감 MVP가 아니다. 핵심 시나리오 하나를 거의 완성형처럼 보이게 만들어야 한다.
- 다만 범위 통제를 위해 전 과목, 완전 자동 채점, 영상 중심 면접형 제품으로는 가지 않는다.
- AI는 최종 판정 보조 역할이다. 최종 점수와 최종 판단은 교사가 가진다.
- 질문 생성과 분석은 반드시 구조화된 출력으로 남긴다.
- 프롬프트 버전, 모델 버전, 분석 근거를 로그로 남긴다.
- 공개 저장소 제출이므로 비밀키와 민감정보는 저장소에 남기지 않는다.
- 데모 데이터는 가급적 가상 또는 익명화 데이터를 사용한다.
- 문서와 실제 구현이 어긋나면 안 된다.

## 문서 읽기 순서

1. [PROJECT_RULES.md](C:/Users/주원/Desktop/gongmo/PROJECT_RULES.md)
2. [WORKBOARD.md](C:/Users/주원/Desktop/gongmo/WORKBOARD.md)
3. [docs/README.md](C:/Users/주원/Desktop/gongmo/docs/README.md)
4. [docs/source-study.md](C:/Users/주원/Desktop/gongmo/docs/source-study.md)
5. [docs/project-charter.md](C:/Users/주원/Desktop/gongmo/docs/project-charter.md)
6. [docs/mvp-definition.md](C:/Users/주원/Desktop/gongmo/docs/mvp-definition.md)
7. [docs/report-writing-rules.md](C:/Users/주원/Desktop/gongmo/docs/report-writing-rules.md)
8. [docs/implementation-roadmap.md](C:/Users/주원/Desktop/gongmo/docs/implementation-roadmap.md)
9. [docs/tech-stack-decision.md](C:/Users/주원/Desktop/gongmo/docs/tech-stack-decision.md)
10. [docs/ai-development-master-plan.md](C:/Users/주원/Desktop/gongmo/docs/ai-development-master-plan.md)
11. [docs/ai-quality-and-evaluation.md](C:/Users/주원/Desktop/gongmo/docs/ai-quality-and-evaluation.md)
12. [docs/ai-runtime-and-deployment.md](C:/Users/주원/Desktop/gongmo/docs/ai-runtime-and-deployment.md)
13. [docs/v1-feature-spec.md](C:/Users/주원/Desktop/gongmo/docs/v1-feature-spec.md)
14. [docs/progress-management.md](C:/Users/주원/Desktop/gongmo/docs/progress-management.md)
15. [docs/file-governance.md](C:/Users/주원/Desktop/gongmo/docs/file-governance.md)
16. [docs/report-production-plan.md](C:/Users/주원/Desktop/gongmo/docs/report-production-plan.md)
17. [docs/repository-structure.md](C:/Users/주원/Desktop/gongmo/docs/repository-structure.md)
18. [docs/system-architecture.md](C:/Users/주원/Desktop/gongmo/docs/system-architecture.md)
19. [docs/domain-model.md](C:/Users/주원/Desktop/gongmo/docs/domain-model.md)
20. [docs/ai-strategy.md](C:/Users/주원/Desktop/gongmo/docs/ai-strategy.md)
21. [docs/engineering-rules.md](C:/Users/주원/Desktop/gongmo/docs/engineering-rules.md)
22. [docs/security-safety-and-compliance.md](C:/Users/주원/Desktop/gongmo/docs/security-safety-and-compliance.md)
23. [docs/contest-submission-guide.md](C:/Users/주원/Desktop/gongmo/docs/contest-submission-guide.md)
24. [docs/ai-report-outline.md](C:/Users/주원/Desktop/gongmo/docs/ai-report-outline.md)
25. [reports/ai-report-draft.md](C:/Users/주원/Desktop/gongmo/reports/ai-report-draft.md)
26. [reports/progress-summary.md](C:/Users/주원/Desktop/gongmo/reports/progress-summary.md)

## 소스 진실의 원천

- [title.md](C:/Users/주원/Desktop/gongmo/title.md): 프로젝트 본질과 차별점 정의
- [gongmo.md](C:/Users/주원/Desktop/gongmo/gongmo.md): 공모전 규정과 제출물
- `① 개인정보 수집/이용 동의서.docx`: 참가자별 작성 문서
- `② 참가 각서.docx`: 팀 단위 또는 개인 단위 서명 문서
- `③ AI리포트.docx`: 제출용 리포트 양식

## 준비 상태

- 원본 기획 문서 검토 완료
- 공모전 요구사항 검토 완료
- 제출 서류 형식 검토 완료
- 시작 기준 문서 작성 완료
- 공모전 제출형 v1 기준으로 범위 재정렬 중
- 웹 앱과 AI 검증 흐름 1차 구현 완료
