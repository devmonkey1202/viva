# 도메인 모델

이 문서는 제품이 다루는 핵심 객체와 상태를 정리한다. 구현 전에 도메인 용어를 고정하지 않으면 UI와 DB, AI 출력이 서로 다른 말을 쓰게 된다.

## 1. 핵심 엔터티

### Assignment

- 과제 또는 검증 대상 단위
- 필드 예시:
  id
  title
  description
  course_name
  assignment_type
  created_by
  created_at

### Rubric

- 교사가 입력한 평가 기준
- 필드 예시:
  id
  assignment_id
  learning_goals
  core_concepts
  forbidden_patterns
  expected_reasoning_signals
  created_at

### Submission

- 학생이 제출한 결과물
- 필드 예시:
  id
  assignment_id
  student_id
  raw_content
  normalized_content
  source_type
  submitted_at

### QuestionSet

- 제출물 기반 생성된 검증 질문 묶음
- 필드 예시:
  id
  submission_id
  why_question
  transfer_question
  counterexample_question
  generation_prompt_version
  generation_model_version
  created_at

### ResponseSession

- 학생 답변 세션
- 필드 예시:
  id
  question_set_id
  answer_mode
  started_at
  completed_at
  status

### Answer

- 학생 개별 답변
- 필드 예시:
  id
  response_session_id
  question_type
  raw_answer
  normalized_answer
  duration_seconds

### AnalysisReport

- AI와 도메인 규칙이 조합된 분석 결과
- 필드 예시:
  id
  response_session_id
  classification
  confidence_band
  semantic_alignment
  concept_coverage
  transfer_ability
  contradiction_check
  missing_concepts
  misconception_labels
  teacher_summary
  analysis_prompt_version
  analysis_model_version
  created_at

### TeacherDecision

- 교사의 최종 판단
- 필드 예시:
  id
  analysis_report_id
  final_decision
  notes
  decided_by
  decided_at

### MisconceptionCluster

- 여러 리포트에서 반복 등장한 오개념 패턴
- 필드 예시:
  id
  label
  description
  occurrence_count
  related_concepts

### AuditLog

- 실행 추적용 로그
- 필드 예시:
  id
  entity_type
  entity_id
  action
  prompt_version
  model_version
  actor
  timestamp

## 2. 관계

- Assignment 1:N Rubric
- Assignment 1:N Submission
- Submission 1:1 QuestionSet
- QuestionSet 1:1 ResponseSession
- ResponseSession 1:N Answer
- ResponseSession 1:1 AnalysisReport
- AnalysisReport 1:0..1 TeacherDecision

## 3. 상태 전이

### Submission 상태

- `draft`
- `submitted`
- `question_generated`
- `answered`
- `analyzed`
- `teacher_reviewed`

### ResponseSession 상태

- `not_started`
- `in_progress`
- `completed`
- `failed`

### AnalysisReport 상태

- `pending`
- `completed`
- `needs_retry`
- `invalid_schema`
- `escalated_to_teacher`

## 4. 결과 분류값

### 이해 충분

- 제출물과 답변이 일관되고
- 핵심 개념이 다뤄지며
- 조건 변경에도 개념 전이가 가능하고
- 논리 충돌이 크지 않은 상태

### 표면 암기

- 용어는 말하지만 의미 설명이 얕고
- 전이 질문에서 약하며
- 자기 언어로 재구성이 약한 상태

### 제출물 의존

- 제출물에는 적혀 있으나
- 학생 답변이 그 내용을 자기 설명으로 풀지 못하는 상태

### 핵심 오개념

- 핵심 개념을 잘못 설명하거나
- 반례 질문에서 명확한 오해가 드러나는 상태

### 불확실

- 답변 길이 부족, 모호한 표현, 상충하는 신호 등으로
- 안전하게 판정하기 어려운 상태

## 5. 도메인 불변 조건

- QuestionSet은 반드시 세 질문 축을 모두 가져야 한다.
- AnalysisReport는 원본 입력을 참조할 수 있어야 한다.
- TeacherDecision 없이 AI 결과만으로 최종 점수화할 수 없다.
- AnalysisReport는 prompt/model version이 없으면 유효하지 않다.
- 불확실 사례는 자동으로 긍정 또는 부정 판정으로 강제 변환하지 않는다.

## 6. 출력 계약 원칙

- 결과는 점수 하나보다 구조화된 근거를 우선한다.
- 모든 결과는 교사가 읽을 수 있는 요약과 기계가 읽을 수 있는 필드를 동시에 가진다.
- UI 전용 문구와 저장용 값은 분리한다.

## 7. 추천 스키마 파일

- `schemas/question-set.schema.json`
- `schemas/analysis-report.schema.json`
- `schemas/teacher-decision.schema.json`
- `schemas/export-row.schema.json`

## 8. 용어 금지 목록

아래 표현은 도메인 모델에서 우선순위를 낮춘다.

- 탐지 점수
- AI 의심도
- 부정행위 확률
- 작성자 판별

이 제품의 핵심은 `이해 검증`이므로 용어 또한 그 방향을 따라야 한다.
