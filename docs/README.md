# 문서 인덱스

이 폴더는 구현보다 먼저 고정해야 하는 기준 문서를 모아둔다. 여기의 목적은 "무엇을 만들지"보다 "무엇을 만들지 말아야 하는지"까지 같이 고정하는 데 있다.

## 읽기 순서

1. [source-study.md](C:/Users/주원/Desktop/gongmo/docs/source-study.md)
2. [project-charter.md](C:/Users/주원/Desktop/gongmo/docs/project-charter.md)
3. [mvp-definition.md](C:/Users/주원/Desktop/gongmo/docs/mvp-definition.md)
4. [report-writing-rules.md](C:/Users/주원/Desktop/gongmo/docs/report-writing-rules.md)
5. [implementation-roadmap.md](C:/Users/주원/Desktop/gongmo/docs/implementation-roadmap.md)
6. [tech-stack-decision.md](C:/Users/주원/Desktop/gongmo/docs/tech-stack-decision.md)
7. [ai-development-master-plan.md](C:/Users/주원/Desktop/gongmo/docs/ai-development-master-plan.md)
8. [ai-quality-and-evaluation.md](C:/Users/주원/Desktop/gongmo/docs/ai-quality-and-evaluation.md)
9. [ai-runtime-and-deployment.md](C:/Users/주원/Desktop/gongmo/docs/ai-runtime-and-deployment.md)
10. [v1-feature-spec.md](C:/Users/주원/Desktop/gongmo/docs/v1-feature-spec.md)
11. [progress-management.md](C:/Users/주원/Desktop/gongmo/docs/progress-management.md)
12. [file-governance.md](C:/Users/주원/Desktop/gongmo/docs/file-governance.md)
13. [report-production-plan.md](C:/Users/주원/Desktop/gongmo/docs/report-production-plan.md)
14. [repository-structure.md](C:/Users/주원/Desktop/gongmo/docs/repository-structure.md)
15. [system-architecture.md](C:/Users/주원/Desktop/gongmo/docs/system-architecture.md)
16. [domain-model.md](C:/Users/주원/Desktop/gongmo/docs/domain-model.md)
17. [ai-strategy.md](C:/Users/주원/Desktop/gongmo/docs/ai-strategy.md)
18. [engineering-rules.md](C:/Users/주원/Desktop/gongmo/docs/engineering-rules.md)
19. [security-safety-and-compliance.md](C:/Users/주원/Desktop/gongmo/docs/security-safety-and-compliance.md)
20. [contest-submission-guide.md](C:/Users/주원/Desktop/gongmo/docs/contest-submission-guide.md)
21. [ai-report-outline.md](C:/Users/주원/Desktop/gongmo/docs/ai-report-outline.md)
22. [decision-log.md](C:/Users/주원/Desktop/gongmo/docs/decision-log.md)

## 문서 역할

- `source-study.md`
  원본 자료에서 추출한 필수 사실과 금지 사항을 정리한다.
- `project-charter.md`
  프로젝트 정체성, 문제 정의, 사용자, 가치, 위험을 고정한다.
- `mvp-definition.md`
  공모전 제출형 v1의 범위와 완성도 기준을 정하는 문서다.
- `report-writing-rules.md`
  대회 요구사항과 AI 리포트 양식에 맞춰 계속 문서를 작성하기 위한 규칙 문서다.
- `implementation-roadmap.md`
  구현 단계를 언제 무엇으로 끝낼지 정리한 실행 로드맵이다.
- `tech-stack-decision.md`
  구현 언어, 프레임워크, 검증 방식, 효율화 방식, 문서 운영 전략을 고정한 문서다.
- `ai-development-master-plan.md`
  AI를 핵심 엔진으로 개발하기 위한 전체 설계 문서다.
- `ai-quality-and-evaluation.md`
  AI 기능 품질을 어떻게 검증할지 정리한 문서다.
- `ai-runtime-and-deployment.md`
  AI 기능을 배포 가능한 서비스로 운영하기 위한 런타임 계획 문서다.
- `v1-feature-spec.md`
  실제로 만들어야 할 화면, 기능, 서비스 단위를 구체화한 문서다.
- `progress-management.md`
  진행 상황을 어떤 파일로 관리할지 정한 운영 문서다.
- `file-governance.md`
  파일 추가, 위치, 정리 기준을 정한 문서다.
- `report-production-plan.md`
  AI 리포트와 제출 문서를 구현과 병행해서 생산하기 위한 계획 문서다.
- `repository-structure.md`
  저장소가 커지더라도 경계가 무너지지 않도록 폴더 구조와 책임을 정의한다.
- `system-architecture.md`
  컴포넌트 경계, 데이터 흐름, 실행 흐름, 장애 처리 기준을 정리한다.
- `domain-model.md`
  제품이 다루는 핵심 엔터티와 상태 전이를 정의한다.
- `ai-strategy.md`
  모델 역할, 프롬프트 버전 관리, 토큰 최적화, 재현성 전략을 정리한다.
- `engineering-rules.md`
  클린 코드, 테스트, 예외 처리, 리뷰 기준을 정리한다.
- `security-safety-and-compliance.md`
  개인정보, 공정성, 감시 인상 방지, 이의제기 구조를 정리한다.
- `contest-submission-guide.md`
  제출물, 동결 계획, 체크리스트를 정리한다.
- `ai-report-outline.md`
  공식 AI 리포트 양식에 바로 옮길 수 있는 작성 가이드를 제공한다.
- `decision-log.md`
  이후 기술 및 제품 결정을 누적 기록한다.

## 기준 문서 우선순위

우선순위는 아래 순서를 따른다.

1. 공모전 원문과 제출 서식
2. `title.md`
3. `PROJECT_RULES.md`
4. 이 `docs/` 폴더의 기준 문서
5. 구현 코드

코드가 문서와 충돌하면, 먼저 문서가 오래되었는지 확인하고 즉시 둘 중 하나를 맞춘다. 그대로 방치하지 않는다.
