# AI 런타임 및 배포 계획

이 문서는 AI 기능을 배포 가능한 서비스로 운영하기 위한 런타임 계획을 정리한다.

## 1. 전제

- 목표는 로컬 프로토타입이 아니라 배포 가능한 서비스다.
- 따라서 모델 호출도 배포 환경에서 안정적으로 돌아야 한다.

## 2. 런타임 구조

권장 구조:

- Web UI
- API layer
- AI service adapter
- storage
- observability

초기 v1은 동기 호출 기반으로 가되, 너무 느려지면 질문 생성과 분석 중 하나를 비동기 작업으로 전환할 수 있게 구조를 분리한다.

## 3. 환경 변수

권장 예시:

- `AI_API_KEY`
- `AI_FAST_MODEL`
- `AI_REASONING_MODEL`
- `AI_REQUEST_TIMEOUT_MS`
- `AI_MAX_RETRIES`

원칙:

- 모델명은 코드에 하드코딩하지 않는다.
- 키는 절대 클라이언트로 보내지 않는다.

## 4. 타임아웃과 재시도

- 질문 생성과 분석은 각각 timeout 설정
- 네트워크/일시 오류는 제한적 재시도
- schema validation 실패는 같은 입력으로 재시도하되 횟수 제한

## 5. 실패 UX

- 질문 생성 실패: 재생성 버튼
- 분석 실패: 다시 분석 버튼
- 배포 환경에서 AI 장애 시 전체 화면이 죽지 않게 분리

## 6. 저장 전략

저장할 것:

- normalized input
- output json
- prompt version
- model version
- runtime metadata

즉시 저장하지 않을 것:

- 민감정보가 섞인 raw payload

## 7. 관측성

최소 로그:

- request id
- endpoint
- latency
- retries
- schema validation result
- token usage
- final status

## 8. 비용 통제

- fast model과 reasoning model 분리
- 긴 입력은 정리 후 투입
- 동일 세션 중복 분석 방지
- 필요 시 캐시

## 9. 배포 전 점검

- 서버 환경 변수 정상 주입
- 프론트에서 AI 키 노출 없음
- AI 호출 실패 시 UX 정상
- 응답 저장 정상
- 로그 확인 가능

## 10. 출시 후 점검

- 질문 생성 실패율
- 분석 실패율
- 평균 대기 시간
- 스키마 실패율
- 불확실 비율 과다 여부

## 11. v1 운영 원칙

- 먼저 안정적 동작
- 다음 품질 개선
- 마지막 비용 최적화

배포형 공모전 서비스에서는 "가끔 똑똑함"보다 "항상 안전하게 동작함"이 더 중요하다.
