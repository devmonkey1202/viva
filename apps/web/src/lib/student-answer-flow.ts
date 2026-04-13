import type {
  AnalyzeSubmissionRequest,
  QuestionSet,
  QuestionType,
  StudentAnswer,
  StudentVerificationSession,
} from "@/lib/schemas";

export type StudentAnswerArtifact = {
  inputMethod: "text" | "voice";
  rawTranscript?: string;
  normalizationNotes: string[];
  editedAfterTranscription?: boolean;
};

export const initialLiveTranscript: Record<QuestionType, string> = {
  why: "",
  transfer: "",
  counterexample: "",
};

export const normalizeTranscript = (value: string) => {
  const notes: string[] = [];
  const trimmed = value.trim();
  const withoutLineBreaks = trimmed.replace(/\s*\n+\s*/g, " ");
  const singleSpaced = withoutLineBreaks.replace(/\s+/g, " ");
  const normalized = singleSpaced.replace(/\s+([,.!?])/g, "$1");

  if (trimmed !== singleSpaced) {
    notes.push("전사 텍스트의 공백과 줄바꿈을 정리했습니다.");
  }

  if (singleSpaced !== normalized) {
    notes.push("구두점 앞 공백을 정리했습니다.");
  }

  return {
    text: normalized,
    notes,
  };
};

export const mergeVoiceText = (current: string, incoming: string) =>
  current.trim().length > 0 ? `${current.trim()} ${incoming}`.trim() : incoming;

export const uniqueNotes = (values: string[]) => [
  ...new Set(values.filter(Boolean)),
];

export const speechErrorMessage = (error: string) => {
  switch (error) {
    case "audio-capture":
      return "마이크를 찾을 수 없습니다. 텍스트 입력으로 계속 진행해 주세요.";
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한이 없어 음성 입력을 사용할 수 없습니다.";
    case "network":
      return "음성 인식 중 네트워크 오류가 발생했습니다. 텍스트 입력으로 계속 진행해 주세요.";
    case "no-speech":
      return "음성이 감지되지 않았습니다. 다시 시도하거나 텍스트로 입력해 주세요.";
    default:
      return "음성 인식 중 오류가 발생했습니다. 텍스트 입력으로 계속 진행해 주세요.";
  }
};

export const buildInitialAnswers = (verification: StudentVerificationSession) => ({
  why: verification.studentAnswers?.find((item) => item.type === "why")?.answer ?? "",
  transfer:
    verification.studentAnswers?.find((item) => item.type === "transfer")
      ?.answer ?? "",
  counterexample:
    verification.studentAnswers?.find((item) => item.type === "counterexample")
      ?.answer ?? "",
});

export const buildInitialArtifacts = (
  verification: StudentVerificationSession,
): Record<QuestionType, StudentAnswerArtifact> => {
  const byType = (type: QuestionType) =>
    verification.studentAnswers?.find((item) => item.type === type);

  const toArtifact = (
    answer: StudentAnswer | undefined,
  ): StudentAnswerArtifact => ({
    inputMethod: answer?.inputMethod ?? "text",
    rawTranscript: answer?.rawTranscript,
    normalizationNotes: answer?.normalizationNotes ?? [],
    editedAfterTranscription: answer?.editedAfterTranscription,
  });

  return {
    why: toArtifact(byType("why")),
    transfer: toArtifact(byType("transfer")),
    counterexample: toArtifact(byType("counterexample")),
  };
};

export const buildAnalyzeRequest = (input: {
  verification: StudentVerificationSession;
  questionSet: QuestionSet;
  answers: Record<QuestionType, string>;
  answerArtifacts: Record<QuestionType, StudentAnswerArtifact>;
}): AnalyzeSubmissionRequest => ({
  verificationId: input.verification.verificationId,
  questionSet: input.questionSet,
  studentAnswers: input.questionSet.questions.map((question) => ({
    type: question.type,
    answer: input.answers[question.type].trim(),
    inputMethod: input.answerArtifacts[question.type].inputMethod,
    rawTranscript:
      input.answerArtifacts[question.type].rawTranscript?.trim() || undefined,
    normalizationNotes:
      input.answerArtifacts[question.type].normalizationNotes.length > 0
        ? input.answerArtifacts[question.type].normalizationNotes
        : undefined,
    editedAfterTranscription:
      input.answerArtifacts[question.type].editedAfterTranscription,
  })),
});
