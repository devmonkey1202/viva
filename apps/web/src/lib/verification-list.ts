import type { VerificationRecord } from "@/lib/schemas";

export type VerificationListItem = {
  verificationId: string;
  assignmentTitle: string;
  updatedAt: string;
  createdAt: string;
  studentAccessState: VerificationRecord["studentAccessState"];
  classification?: VerificationRecord["analysisReport"] extends infer T
    ? T extends { classification: infer U }
      ? U
      : never
    : never;
  teacherDecision?: VerificationRecord["teacherDecision"] extends infer T
    ? T extends { decision: infer U }
      ? U
      : never
    : never;
  questionModelVersion: string;
  analysisModelVersion?: string;
};

export type VerificationSessionFilter =
  | "all"
  | "awaiting_answers"
  | "analysis_ready"
  | "decision_complete";

const normalize = (value: string) => value.trim().toLowerCase();

export const toVerificationListItem = (
  verification: VerificationRecord,
): VerificationListItem => ({
  verificationId: verification.verificationId,
  assignmentTitle: verification.assignmentTitle,
  updatedAt: verification.updatedAt,
  createdAt: verification.createdAt,
  studentAccessState: verification.studentAccessState,
  classification: verification.analysisReport?.classification,
  teacherDecision: verification.teacherDecision?.decision,
  questionModelVersion: verification.questionSet.modelVersion,
  analysisModelVersion: verification.analysisReport?.modelVersion,
});

export const getVerificationSessionFilter = (
  item: VerificationListItem,
): Exclude<VerificationSessionFilter, "all"> => {
  if (item.teacherDecision) {
    return "decision_complete";
  }

  if (item.classification) {
    return "analysis_ready";
  }

  return "awaiting_answers";
};

export const matchesVerificationSessionFilter = (
  item: VerificationListItem,
  filter: VerificationSessionFilter,
) => filter === "all" || getVerificationSessionFilter(item) === filter;

export const filterVerificationList = (
  records: VerificationRecord[],
  query: string,
  limit: number,
): VerificationListItem[] => {
  const normalizedQuery = normalize(query);

  const filtered = normalizedQuery
    ? records.filter((record) => {
        const haystack = normalize(
          [
            record.assignmentTitle,
            record.assignmentDescription,
            record.verificationId,
            ...record.rubricCoreConcepts,
          ].join(" "),
        );

        return haystack.includes(normalizedQuery);
      })
    : records;

  return filtered.slice(0, limit).map(toVerificationListItem);
};
