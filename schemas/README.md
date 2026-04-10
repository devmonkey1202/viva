# 스키마 관리 규칙

이 폴더에는 AI 출력과 API 계약을 검증하기 위한 스키마를 저장한다.

## 목표

- AI 응답을 자유 문자열이 아니라 구조화된 데이터로 관리한다.
- UI와 저장 계층이 같은 계약을 공유하게 한다.

## 권장 파일

- `question-set.schema.json`
- `analysis-report.schema.json`
- `teacher-decision.schema.json`
- `export-row.schema.json`

## 규칙

- 스키마 변경 시 UI, 저장 구조, 샘플 데이터까지 같이 점검한다.
- 파싱 실패를 정상 흐름으로 처리하지 않는다.
