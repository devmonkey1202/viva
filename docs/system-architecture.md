# 시스템 아키텍처

이 문서는 VIVA v1의 시스템 관점 구조를 정의한다. 핵심은 "작아도 구조가 무너지지 않게" 만드는 것이다.

## 1. 아키텍처 목표

- 질문 생성과 분석 흐름이 분리되어야 한다.
- 제출물, 루브릭, 답변, 분석 결과가 추적 가능해야 한다.
- AI 호출 실패 시 재시도와 fallback 경로가 있어야 한다.
- 교사 최종 판단이 데이터 모델상 명시되어야 한다.
- 향후 LMS 연동 이전에도 독립 웹앱으로 완결돼야 한다.

## 2. 상위 컴포넌트

### 웹 UI

- 교사용 화면
- 학생용 답변 화면
- 운영자 집계 화면

### 애플리케이션 API

- 과제/세션 생성
- 질문 생성 요청
- 답변 저장
- 분석 실행
- 결과 조회
- 내보내기

### 도메인 서비스

- 질문 생성 요청 조립
- 분석 기준 조립
- 결과 분류
- 교사 판단 반영

### AI 실행 계층

- 프롬프트 로딩
- 모델 라우팅
- 출력 파싱
- 스키마 검증
- 오류 처리

### 저장 계층

- 과제/루브릭 저장
- 제출물 저장
- 질문 세트 저장
- 답변 저장
- 분석 리포트 저장
- 감사 로그 저장

## 3. 핵심 데이터 흐름

### 흐름 A: 질문 생성

1. 교사가 과제와 루브릭을 입력한다.
2. 학생 제출물이 저장된다.
3. 질문 생성 서비스가 제출물과 루브릭을 읽는다.
4. AI가 왜형/전이형/반례형 질문을 구조화된 형태로 반환한다.
5. 시스템은 질문 세트를 저장한다.

### 흐름 B: 학생 답변 수집

1. 학생은 질문을 확인한다.
2. 학생은 텍스트 또는 음성으로 답변한다.
3. 음성일 경우 STT를 거쳐 텍스트 정규화본을 만든다.
4. 원본 답변과 정규화 텍스트를 함께 저장한다.

### 흐름 C: 분석

1. 분석 서비스가 제출물, 루브릭, 질문, 답변을 수집한다.
2. AI 분석 계층이 의미 비교를 수행한다.
3. 결과는 스키마 검증을 거쳐 저장된다.
4. 도메인 서비스가 결과 상태와 교사용 요약을 구성한다.
5. 교사는 결과를 보고 최종 판단을 남긴다.

### 흐름 D: 집계

1. 여러 분석 결과가 모인다.
2. 오개념 태그와 누락 개념을 집계한다.
3. 반/과정 수준의 분포 데이터를 만든다.

## 4. 경계별 책임

### UI는 해야 하는 일

- 입력 수집
- 상태 표시
- 근거를 읽기 좋게 배치
- 교사 판단 버튼 제공

### UI가 하면 안 되는 일

- 판정 규칙 결정
- 프롬프트 구성
- AI 응답 임의 해석

### 도메인 계층은 해야 하는 일

- 분석 기준 정의
- 결과 상태 분류 규칙 정의
- 교사 최종 판단을 1급 데이터로 저장

### AI 계층은 해야 하는 일

- 질문 생성
- 의미 비교
- 근거 초안 구성
- 오개념 후보 태깅

### AI 계층이 하면 안 되는 일

- 최종 점수 확정
- 도메인 상태 임의 추가
- UI 친화성을 이유로 핵심 근거 삭제

## 5. 권장 인터페이스

### Question Generation Input

- assignment summary
- rubric concepts
- forbidden or weak concepts
- submission text

### Question Generation Output

- question set id
- why question
- transfer question
- counterexample question
- question rationales

### Analysis Input

- submission text
- rubric concepts
- generated questions
- normalized answers

### Analysis Output

- result classification
- confidence band
- semantic alignment notes
- concept coverage notes
- transfer ability notes
- contradiction findings
- missing concepts
- misconception labels
- teacher-facing summary

## 6. 저장 전략

### 반드시 저장할 것

- 과제 메타데이터
- 루브릭 원문과 구조화본
- 제출물 원문 또는 정규화본
- 질문 세트
- 학생 답변 원문과 정규화본
- 분석 결과 JSON
- 프롬프트 버전
- 모델 버전
- 실행 시각
- 교사 최종 판단

### 분리 저장 권장

- 감사 로그
- 사용자 이벤트 로그
- AI raw response

원본 raw response는 개인정보와 토큰 비용 문제 때문에 보존 기간을 짧게 가져가거나 마스킹한다.

## 7. 장애 처리

질문 생성 실패 시:

- 사용자에게 재시도 가능 상태를 보여준다.
- 실패 원인을 내부 로그에 남긴다.
- 부분 생성이 일어났다면 전부 폐기하고 재생성한다.

분석 실패 시:

- 기존 데이터는 유지한다.
- 교사가 재분석을 요청할 수 있어야 한다.
- 실패 상태를 화면에서 구분해 보여준다.

STT 실패 시:

- 원본 음성을 보존할지 여부는 개인정보 정책에 따른다.
- 우선 MVP에서는 텍스트 입력 fallback을 제공한다.

## 8. 관측 가능성

각 실행마다 아래를 남긴다.

- request id
- assignment id
- submission id
- question set id
- analysis id
- prompt version
- model version
- elapsed time
- token usage
- final status

## 9. 배포 관점

v1은 독립 웹앱으로 간다.

- 웹 UI와 API를 한 저장소에서 운영해도 된다.
- 배포는 단일 웹 서비스와 관리형 DB 조합이 현실적이다.
- 향후 LMS 통합은 별도 확장 경로로 남긴다.

## 10. 구조 검증 질문

이 아키텍처를 유지하는지 확인하려면 아래를 묻는다.

- 교사 판단이 AI 결과와 구분되는가
- 프롬프트 버전이 추적되는가
- 질문 생성과 분석이 분리되는가
- 오개념 근거가 저장되는가
- 실패 상태가 정상 상태와 구분되는가
