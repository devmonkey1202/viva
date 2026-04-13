import {
  ANSWER_ANALYSIS_PROMPT_VERSION,
  QUESTION_GENERATION_PROMPT_VERSION,
} from "@/lib/ai/prompt-templates";
import type {
  AnalysisReport,
  AnalyzeUnderstandingRequest,
  GenerateQuestionSetRequest,
  QuestionSet,
  QuestionType,
} from "@/lib/schemas";

const getFocusExcerpt = (submissionText: string) => {
  const [firstSentence] = submissionText.split(".");
  return firstSentence.trim().slice(0, 72);
};

const getQuestionTargetConcepts = (
  concepts: string[],
  fallback: string,
): string[] =>
  concepts.slice(0, 2).filter(Boolean).length > 0
    ? concepts.slice(0, 2)
    : [fallback];

export const generateMockQuestionSet = (
  input: GenerateQuestionSetRequest,
  options?: {
    fallbackReason?: string;
  },
): QuestionSet => {
  const excerpt = getFocusExcerpt(input.submissionText);
  const targetConcepts = getQuestionTargetConcepts(
    input.rubricCoreConcepts,
    "핵심 개념",
  );

  return {
    questionSetId: `qs_mock_${crypto.randomUUID()}`,
    generatedAt: new Date().toISOString(),
    promptVersion: QUESTION_GENERATION_PROMPT_VERSION,
    modelVersion: "mock-engine",
    overallStrategy:
      "제출물의 핵심 주장과 루브릭 핵심 개념을 기준으로 이유, 조건 변화, 반례를 각각 검증하도록 질문을 구성했습니다.",
    cautionNotes: [
      "현재 결과는 mock 엔진으로 생성되었습니다.",
      "실제 모델 연결 시 질문 문장과 근거 표현은 달라질 수 있습니다.",
      ...(options?.fallbackReason
        ? [`Mock fallback reason: ${options.fallbackReason}`]
        : []),
    ],
    questions: [
      {
        type: "why",
        question: `제출물에서 "${excerpt}"라고 설명했는데, 왜 그렇게 판단했는지 실험 근거를 중심으로 설명해 주세요.`,
        intent:
          "학생이 제출물의 핵심 설명을 자기 언어로 다시 근거화할 수 있는지 확인합니다.",
        targetConcepts,
        riskSignals: input.rubricRiskPoints,
      },
      {
        type: "transfer",
        question:
          "실험 조건이 달라져 공기 저항이 거의 없거나 측정 장비가 더 정확해진다면, 결과 해석은 어떻게 달라져야 하나요?",
        intent:
          "조건 변화 상황에서 개념을 전이해 설명할 수 있는지 확인합니다.",
        targetConcepts,
        riskSignals: input.rubricRiskPoints,
      },
      {
        type: "counterexample",
        question:
          "제출물의 설명이 항상 성립하지 않는 경우는 무엇인지, 반례나 적용 한계를 들어 설명해 주세요.",
        intent:
          "설명의 적용 범위와 반례를 구분할 수 있는지 확인합니다.",
        targetConcepts,
        riskSignals: input.rubricRiskPoints,
      },
    ],
  };
};

const includesAny = (text: string, candidates: string[]) =>
  candidates.some((candidate) => text.includes(candidate));

const normalizeText = (value: string) => value.trim().toLowerCase();

const getAnswersByType = (
  input: AnalyzeUnderstandingRequest,
): Record<QuestionType, string> => ({
  why:
    input.studentAnswers.find((answer) => answer.type === "why")?.answer ?? "",
  transfer:
    input.studentAnswers.find((answer) => answer.type === "transfer")?.answer ??
    "",
  counterexample:
    input.studentAnswers.find((answer) => answer.type === "counterexample")
      ?.answer ?? "",
});

export const analyzeMockUnderstanding = (
  input: AnalyzeUnderstandingRequest,
  options?: {
    fallbackReason?: string;
  },
): AnalysisReport => {
  const answers = getAnswersByType(input);
  const why = normalizeText(answers.why);
  const transfer = normalizeText(answers.transfer);
  const counterexample = normalizeText(answers.counterexample);
  const combined = `${why} ${transfer} ${counterexample}`;

  const coveredConcepts = input.rubricCoreConcepts.filter((concept) =>
    combined.includes(concept.toLowerCase()),
  );
  const missingConcepts = input.rubricCoreConcepts.filter(
    (concept) => !coveredConcepts.includes(concept),
  );

  const strongWhy =
    why.length > 25 &&
    includesAny(why, ["이유", "근거", "그래서", "때문", "원인"]);
  const strongTransfer =
    transfer.length > 25 &&
    includesAny(transfer, ["만약", "조건", "달라", "경우", "변화"]);
  const strongCounterexample =
    counterexample.length > 25 &&
    includesAny(counterexample, ["한계", "아니", "반례", "경우", "성립하지"]);

  const misconceptionDetected = includesAny(combined, [
    "중력가속도가 커진",
    "중력가속도는 속도 자체",
    "공기 저항이 없으면 가속도가 0",
  ]);

  const contradictionFound =
    input.submissionText.includes("낙하 시간이 짧아질수록 가속도가 커진다") &&
    counterexample.includes("가속도 자체는 거의 일정");

  let classification: AnalysisReport["classification"] = "uncertain";
  let confidenceBand: AnalysisReport["confidenceBand"] = "medium";
  const misconceptionLabels: string[] = [];
  const riskFlags: string[] = [];

  if (misconceptionDetected) {
    classification = "core_misconception";
    confidenceBand = "high";
    misconceptionLabels.push("핵심 개념 오해");
  } else if (strongWhy && strongTransfer && strongCounterexample) {
    classification = "sufficient_understanding";
    confidenceBand = "high";
  } else if (strongWhy && !strongTransfer) {
    classification = "surface_memorization";
    confidenceBand = "medium";
    riskFlags.push("조건 변화 질문에서 개념 전이가 약함");
  } else if (!strongWhy && !strongTransfer && !strongCounterexample) {
    classification = "submission_dependency";
    confidenceBand = "low";
    riskFlags.push("제출물 설명을 자기 언어로 풀어내는 신호가 부족함");
  } else {
    classification = "uncertain";
    confidenceBand = "medium";
    riskFlags.push("답변 신호가 혼합되어 교사 검토가 필요함");
  }

  if (missingConcepts.length > 0) {
    riskFlags.push("일부 루브릭 개념 언급 부족");
  }

  if (contradictionFound) {
    riskFlags.push("제출물과 답변 사이에 논리 충돌 가능성");
  }

  if (options?.fallbackReason) {
    riskFlags.push(`Mock fallback reason: ${options.fallbackReason}`);
  }

  const reteachingPoints =
    missingConcepts.length > 0
      ? missingConcepts.map(
          (concept) => `${concept} 개념을 다시 확인할 필요가 있습니다.`,
        )
      : ["조건 변화와 반례 설명을 더 연결해 말하도록 유도하면 좋습니다."];

  return {
    analysisId: `ar_mock_${crypto.randomUUID()}`,
    generatedAt: new Date().toISOString(),
    promptVersion: ANSWER_ANALYSIS_PROMPT_VERSION,
    modelVersion: "mock-engine",
    classification,
    confidenceBand,
    semanticAlignment: {
      status:
        strongWhy || contradictionFound ? "partially_aligned" : "misaligned",
      evidence: [
        "학생 답변이 제출물의 주장과 얼마나 연결되는지 확인했습니다.",
        contradictionFound
          ? "답변이 제출물의 일부 설명을 수정하거나 뒤집는 신호가 보입니다."
          : "자기 언어로 근거를 다시 설명하려는 시도가 관찰됩니다.",
      ],
    },
    conceptCoverage: {
      coveredConcepts,
      missingConcepts,
    },
    transferAbility: {
      status: strongTransfer ? "strong" : strongWhy ? "partial" : "unclear",
      evidence: [
        strongTransfer
          ? "조건 변화 상황을 가정하고 결과 해석 변화를 설명했습니다."
          : "조건 변화 상황에 대한 설명이 충분히 구체적이지 않습니다.",
      ],
    },
    contradictionCheck: {
      status: contradictionFound ? "minor" : "none",
      contradictions: contradictionFound
        ? [
            {
              submissionClaim:
                "낙하 시간이 짧아질수록 가속도가 커진다고 보고 있습니다.",
              answerClaim: answers.counterexample,
              explanation:
                "학생 답변이 제출물의 기존 설명을 부분적으로 수정하고 있습니다.",
            },
          ]
        : [],
    },
    misconceptionLabels,
    teacherSummary:
      classification === "sufficient_understanding"
        ? "학생은 제출물의 설명을 반복하는 수준을 넘어, 조건 변화와 반례까지 자기 언어로 설명하고 있습니다."
        : classification === "core_misconception"
          ? "학생 답변에서 핵심 개념을 잘못 이해한 신호가 보여 추가 설명과 교사 확인이 필요합니다."
          : classification === "submission_dependency"
            ? "제출물은 정리돼 있지만 답변에서 실제 이해를 뒷받침하는 설명 신호가 약합니다."
            : classification === "surface_memorization"
              ? "표현은 사용하지만 전이 질문에서 설명 깊이가 부족해 표면 암기 가능성이 있습니다."
              : "답변 신호가 혼합되어 있어 교사의 추가 확인이 필요합니다.",
    reteachingPoints,
    riskFlags,
  };
};
