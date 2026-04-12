import type {
  AnalyzeUnderstandingRequest,
  GenerateQuestionSetRequest,
} from "@/lib/schemas";

export const demoVerificationInput: GenerateQuestionSetRequest = {
  assignmentTitle: "중력가속도 실험 보고서",
  assignmentDescription:
    "학생은 자유낙하 실험 결과를 바탕으로 중력가속도와 오차 요인을 설명해야 합니다.",
  rubricCoreConcepts: [
    "중력가속도",
    "자유낙하",
    "오차 요인",
    "측정값과 이론값 비교",
  ],
  rubricRiskPoints: [
    "공기 저항과 측정 오차를 구분하지 못함",
    "중력가속도를 속도 증가량과 혼동함",
  ],
  submissionText:
    "실험 결과를 보면 물체가 낙하할수록 속도가 빨라지므로 가속도가 커진다고 볼 수 있다. 여러 번의 측정에서 비슷한 값을 얻었고 이론값과 차이가 있었지만 이는 주로 센서 반응 속도와 공기 저항 때문이라고 정리했다. 중력가속도는 물체가 떨어질 때 점점 빨라지는 정도를 뜻한다.",
};

export const demoAnswerDraft = {
  why: "센서 반응 속도가 느리면 실제 시간보다 길게 측정될 수 있어 오차 요인으로 봤습니다.",
  transfer:
    "만약 진공 상태라면 공기 저항이 줄어들어 이론값에 더 가까워질 것 같습니다.",
  counterexample:
    "낙하 시간이 짧을수록 가속도가 항상 더 큰 것은 아니고 같은 중력장에서는 가속도 자체는 거의 일정합니다.",
};

export const buildDemoAnalyzeRequest = (
  questionSet: AnalyzeUnderstandingRequest["questionSet"],
): AnalyzeUnderstandingRequest => ({
  ...demoVerificationInput,
  questionSet,
  studentAnswers: [
    { type: "why", answer: demoAnswerDraft.why },
    { type: "transfer", answer: demoAnswerDraft.transfer },
    { type: "counterexample", answer: demoAnswerDraft.counterexample },
  ],
});
