# 진행 관리 규칙

이 문서는 구현과 문서 작업을 병행하면서 진행 상황을 어떻게 기록하고 관리할지 정한다.

## 1. 진행 관리에 쓰는 파일

- [WORKBOARD.md](C:/Users/주원/Desktop/gongmo/WORKBOARD.md)
- [docs/decision-log.md](C:/Users/주원/Desktop/gongmo/docs/decision-log.md)
- [reports/progress-summary.md](C:/Users/주원/Desktop/gongmo/reports/progress-summary.md)

## 2. 파일별 역할

### WORKBOARD

- 지금 당장 할 일
- 전체 상태
- 리스크
- 완료 기준

### decision-log

- 중요한 방향 결정
- 제외한 대안
- 결정 이유

### progress-summary

- 현재까지 끝난 일
- 현재 작업 중인 일
- 다음 할 일
- 제출 관점 진행 상태

## 3. 상태 라벨

- `todo`
- `in_progress`
- `blocked`
- `done`

가능하면 상태를 문장으로 흐리지 말고 위 네 가지로 관리한다.

## 4. 업데이트 타이밍

- 큰 작업 시작 전: WORKBOARD 갱신
- 중요한 방향 결정 직후: decision-log 갱신
- 세션 종료 전: progress-summary 갱신
- 제출물 구조가 바뀌면: 관련 문서 같이 갱신

## 5. 진행 요약 작성 규칙

- 사실만 쓴다.
- 완료된 것과 예정인 것을 섞지 않는다.
- "거의", "대충", "아마" 같은 표현을 피한다.
- 심사 기준에 연결되는 표현을 쓴다.
- 기록은 자세하되 문서는 불필요하게 쪼개지 않는다.
- 진행 기록은 중요하지만, 같은 내용을 여러 문서에 중복해서 쓰지 않는다.

## 6. 리스크 관리 방식

리스크가 생기면 아래 네 줄로 정리한다.

- 리스크 내용
- 영향 범위
- 대응 방향
- 결정 시한

## 7. 세션 종료 체크

- 오늘 끝난 일 기록
- 남은 핵심 작업 기록
- 문서와 코드 불일치 여부 확인
- 제출 리스크 여부 확인

## 8. 권장 진행 요약 템플릿

```md
## YYYY-MM-DD

- done:
- in_progress:
- next:
- risks:
- docs_updated:
```

## 9. 금지 사항

- 진행 상황을 채팅에만 남기고 파일에 남기지 않는 것
- 문서 갱신 없이 코드만 바꾸는 것
- 결정 이유 없이 방향을 바꾸는 것
