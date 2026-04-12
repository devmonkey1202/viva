# 작업 보드

이 문서는 현재 구현 상태, 남은 일, 제출 리스크를 한 곳에서 보기 위한 실행 보드입니다.

## 현재 상태

- 제품명 `VIVA` 고정
- 프로젝트 방향은 `제출 이후 이해 검증 레이어`로 고정
- 핵심 화면 구현
  - `/`
  - `/teacher`
  - `/operator`
  - `/student/[verificationId]`
- 핵심 API 구현
  - `/api/health`
  - `/api/questions`
  - `/api/analyze`
  - `/api/teacher-decisions`
  - `/api/verifications/[verificationId]`
  - `/api/summary`
  - `/api/export`
- 저장 구조 구현
  - 로컬 JSON 저장
  - Neon/Postgres 저장 어댑터
- AI 구조 구현
  - OpenAI 연결
  - mock fallback
  - 구조화 JSON 응답
- 학생 음성 입력 구현
  - Web Speech API
  - 텍스트 fallback
  - 전사 메타 저장
- 자동 검증 구현
  - `npm run lint`
  - `npm run build`
  - `npm run smoke:http`
  - `npm run smoke:live`
  - `npm run verify`
- GitHub Actions CI 추가

## 현재 기준 완료로 보는 것

- 교사가 과제와 루브릭을 입력할 수 있다.
- 질문 3개가 생성된다.
- 학생 링크가 발급된다.
- 학생이 텍스트 또는 음성 기반으로 답변할 수 있다.
- 답변이 분석되고 저장된다.
- 교사가 학생 답변, 전사 메타, 분석 근거를 검토할 수 있다.
- 교사가 최종 판단을 저장할 수 있다.
- 운영자가 분포와 패턴을 볼 수 있다.
- JSON/CSV export가 된다.
- 자동 검증이 재실행 가능하다.
- 실AI + 실DB 경로도 로컬 스모크 테스트로 재확인 가능하다.

## 남은 일

1. Vercel 실제 배포
2. 배포 환경 기준 재검증
3. AI 리포트 본문 마감 및 PDF 변환
4. 제출 서류 최종 정리
5. 디자인 전면 재설계

## 현재 리스크

- 라이브 배포 URL이 아직 없다.
- AI 리포트가 아직 초안이다.
- 제출용 PDF 세트가 아직 없다.
- 실AI 운영 하드닝은 더 할 여지가 있다.

## 다음 액션

1. Vercel 배포
2. 배포 후 라이브 스모크 테스트
3. AI 리포트 본문 완성
4. 디자인 작업 시작
