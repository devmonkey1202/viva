import type {
  AnalysisReport,
  QuestionType,
  TeacherDecision,
} from "@/lib/schemas";

export const questionTypeMeta: Record<
  QuestionType,
  { label: string; shortLabel: string; order: number }
> = {
  why: { label: "왜 그렇게 했는지", shortLabel: "왜형", order: 1 },
  transfer: {
    label: "조건이 바뀌면 어떻게 되는지",
    shortLabel: "전이형",
    order: 2,
  },
  counterexample: {
    label: "언제 성립하지 않는지",
    shortLabel: "반례형",
    order: 3,
  },
};

export const analysisClassificationMeta: Record<
  AnalysisReport["classification"],
  {
    label: string;
    tone: "success" | "warning" | "danger" | "info";
    note: string;
  }
> = {
  sufficient_understanding: {
    label: "이해 충분",
    tone: "success",
    note: "핵심 개념과 설명 구조가 루브릭과 안정적으로 맞습니다.",
  },
  surface_memorization: {
    label: "표면 암기",
    tone: "warning",
    note: "표현은 맞지만 구조적 이해를 보여주는 근거가 약합니다.",
  },
  submission_dependency: {
    label: "제출물 의존",
    tone: "warning",
    note: "제출물 표현에 기대고 있어 독립적인 설명력이 낮습니다.",
  },
  core_misconception: {
    label: "핵심 오개념",
    tone: "danger",
    note: "루브릭의 핵심 개념을 잘못 이해했을 가능성이 높습니다.",
  },
  uncertain: {
    label: "불확실",
    tone: "info",
    note: "추가 질문이나 교사 확인이 더 필요합니다.",
  },
};

export const teacherDecisionMeta: Record<
  TeacherDecision["decision"],
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  approved_understanding: {
    label: "이해 확인",
    tone: "success",
  },
  needs_followup: {
    label: "후속 확인 필요",
    tone: "warning",
  },
  manual_review_required: {
    label: "수동 검토 필요",
    tone: "danger",
  },
};

export const formatQuestionType = (type: QuestionType) =>
  questionTypeMeta[type].shortLabel;

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const buildStudentVerificationPath = (verificationId: string) =>
  `/student/${verificationId}`;

export const buildStudentVerificationUrl = (
  origin: string,
  verificationId: string,
) => `${origin}${buildStudentVerificationPath(verificationId)}`;
