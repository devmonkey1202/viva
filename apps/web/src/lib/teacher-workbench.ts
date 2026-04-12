import type {
  AnalysisReport,
  QuestionSet,
  QuestionType,
  StudentAnswer,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationInput,
} from "@/lib/schemas";

export type AnswerDraft = Record<QuestionType, string>;

export type AnswerArtifacts = Record<
  QuestionType,
  {
    inputMethod: "text" | "voice";
    rawTranscript?: string;
    normalizationNotes: string[];
    editedAfterTranscription?: boolean;
  }
>;

export const initialAnswerState: AnswerDraft = {
  why: "",
  transfer: "",
  counterexample: "",
};

export const initialAnswerArtifacts: AnswerArtifacts = {
  why: { inputMethod: "text", normalizationNotes: [] },
  transfer: { inputMethod: "text", normalizationNotes: [] },
  counterexample: { inputMethod: "text", normalizationNotes: [] },
};

export const initialDecisionState: TeacherDecisionInput = {
  decision: "approved_understanding",
  notes: "",
};

export const parseMultilineInput = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const buildVerificationInput = (input: {
  assignmentTitle: string;
  assignmentDescription: string;
  rubricConcepts: string;
  riskPoints: string;
  submissionText: string;
}): VerificationInput => ({
  assignmentTitle: input.assignmentTitle,
  assignmentDescription: input.assignmentDescription,
  rubricCoreConcepts: parseMultilineInput(input.rubricConcepts),
  rubricRiskPoints: parseMultilineInput(input.riskPoints),
  submissionText: input.submissionText,
});

export const answersFromStoredAnswers = (
  answers?: StudentAnswer[],
): AnswerDraft => ({
  why: answers?.find((item) => item.type === "why")?.answer ?? "",
  transfer: answers?.find((item) => item.type === "transfer")?.answer ?? "",
  counterexample:
    answers?.find((item) => item.type === "counterexample")?.answer ?? "",
});

export const artifactsFromStoredAnswers = (
  answers?: StudentAnswer[],
): AnswerArtifacts => ({
  why: {
    inputMethod: answers?.find((item) => item.type === "why")?.inputMethod ?? "text",
    rawTranscript: answers?.find((item) => item.type === "why")?.rawTranscript,
    normalizationNotes:
      answers?.find((item) => item.type === "why")?.normalizationNotes ?? [],
    editedAfterTranscription:
      answers?.find((item) => item.type === "why")?.editedAfterTranscription,
  },
  transfer: {
    inputMethod:
      answers?.find((item) => item.type === "transfer")?.inputMethod ?? "text",
    rawTranscript: answers?.find((item) => item.type === "transfer")?.rawTranscript,
    normalizationNotes:
      answers?.find((item) => item.type === "transfer")?.normalizationNotes ??
      [],
    editedAfterTranscription:
      answers?.find((item) => item.type === "transfer")?.editedAfterTranscription,
  },
  counterexample: {
    inputMethod:
      answers?.find((item) => item.type === "counterexample")?.inputMethod ??
      "text",
    rawTranscript:
      answers?.find((item) => item.type === "counterexample")?.rawTranscript,
    normalizationNotes:
      answers?.find((item) => item.type === "counterexample")
        ?.normalizationNotes ?? [],
    editedAfterTranscription:
      answers?.find((item) => item.type === "counterexample")
        ?.editedAfterTranscription,
  },
});

export const buildStudentAnswers = (
  questionSet: QuestionSet,
  answers: AnswerDraft,
  artifacts: AnswerArtifacts,
): StudentAnswer[] =>
  questionSet.questions.map((question) => {
    const artifact = artifacts[question.type];

    return {
      type: question.type,
      answer: answers[question.type].trim(),
      inputMethod: artifact.inputMethod,
      rawTranscript: artifact.rawTranscript?.trim() || undefined,
      normalizationNotes: artifact.normalizationNotes.length
        ? artifact.normalizationNotes
        : undefined,
      editedAfterTranscription: artifact.editedAfterTranscription,
    };
  });

export const buildSessionStatus = (input: {
  teacherDecision: TeacherDecision | null;
  analysisReport: AnalysisReport | null;
  questionSet: QuestionSet | null;
}) => {
  if (input.teacherDecision) {
    return "교사 판단 완료";
  }

  if (input.analysisReport) {
    return "근거 검토 가능";
  }

  if (input.questionSet) {
    return "학생 응답 대기";
  }

  return "세션 준비 중";
};
