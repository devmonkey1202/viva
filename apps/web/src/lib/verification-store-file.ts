import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type {
  AnalysisReport,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetRequest,
  OperatorSummary,
  StudentAccessState,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationRecord,
} from "@/lib/schemas";
import { VerificationRecordSchema } from "@/lib/schemas";
import { getRuntimeConfig } from "@/lib/runtime-config";

const VerificationStoreFileSchema = z.object({
  verifications: z.array(VerificationRecordSchema).default([]),
});

type VerificationStoreFile = z.infer<typeof VerificationStoreFileSchema>;

const getStorePath = () => getRuntimeConfig().verificationStorePath;

let storeQueue = Promise.resolve();

const queueStoreOperation = async <T>(operation: () => Promise<T>) => {
  const next = storeQueue.then(operation, operation);
  storeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
};

const emptyStore = (): VerificationStoreFile => ({ verifications: [] });

const ensureStoreFile = async () => {
  const storePath = getStorePath();
  const storeDirectory = path.dirname(storePath);

  await mkdir(storeDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(
      storePath,
      JSON.stringify(emptyStore(), null, 2),
      "utf8",
    );
  }
};

const readStore = async () => {
  await ensureStoreFile();
  const storePath = getStorePath();

  const raw = await readFile(storePath, "utf8");
  const parsed = raw.trim().length === 0 ? emptyStore() : JSON.parse(raw);

  return VerificationStoreFileSchema.parse(parsed);
};

const writeStore = async (store: VerificationStoreFile) => {
  await writeFile(getStorePath(), JSON.stringify(store, null, 2), "utf8");
};

const sortByUpdatedAtDesc = (records: VerificationRecord[]) =>
  [...records].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

const buildBuckets = (counts: Map<string, number>, limit = 6) =>
  [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "ko");
    })
    .slice(0, limit);

const incrementBucket = (counts: Map<string, number>, value: string) => {
  const label = value.trim();

  if (!label) {
    return;
  }

  counts.set(label, (counts.get(label) ?? 0) + 1);
};

const requireVerification = (
  records: VerificationRecord[],
  verificationId: string,
) => {
  const verification = records.find(
    (item) => item.verificationId === verificationId,
  );

  if (!verification) {
    throw new Error("해당 검증 세션을 찾을 수 없습니다.");
  }

  return verification;
};

export const createVerificationRecordFromFile = async (
  input: GenerateQuestionSetRequest,
  questionSet: VerificationRecord["questionSet"],
) =>
  queueStoreOperation(async () => {
    const store = await readStore();
    const now = new Date().toISOString();

    const verification = VerificationRecordSchema.parse({
      verificationId: randomUUID(),
      createdAt: now,
      updatedAt: now,
      studentAccessState: "open",
      ...input,
      questionSet,
      activity: [
        {
          type: "question_generated",
          recordedAt: now,
          message: "질문 세트를 생성하고 검증 세션을 시작했습니다.",
        },
      ],
    });

    store.verifications.unshift(verification);
    await writeStore(store);

    return verification;
  });

export const saveAnalysisForVerificationFromFile = async (
  input: AnalyzeUnderstandingStoredRequest,
  analysisReport: AnalysisReport,
) =>
  queueStoreOperation(async () => {
    const store = await readStore();
    const verification = requireVerification(store.verifications, input.verificationId);
    const now = new Date().toISOString();

    verification.updatedAt = now;
    verification.questionSet = input.questionSet;
    verification.studentAnswers = input.studentAnswers;
    verification.analysisReport = analysisReport;
    verification.teacherDecision = undefined;
    verification.activity.push({
      type: "analysis_saved",
      recordedAt: now,
      message: `분석 결과를 저장했습니다. 분류: ${analysisReport.classification}`,
    });

    await writeStore(store);

    return VerificationRecordSchema.parse(verification);
  });

export const saveTeacherDecisionForVerificationFromFile = async (
  verificationId: string,
  decisionInput: TeacherDecisionInput,
) =>
  queueStoreOperation(async () => {
    const store = await readStore();
    const verification = requireVerification(store.verifications, verificationId);
    const now = new Date().toISOString();

    const teacherDecision: TeacherDecision = {
      decision: decisionInput.decision,
      notes: decisionInput.notes,
      decidedAt: now,
    };

    verification.updatedAt = now;
    verification.teacherDecision = teacherDecision;
    verification.activity.push({
      type: "teacher_decision_saved",
      recordedAt: now,
      message: `교사 최종 판단을 저장했습니다. 결정: ${decisionInput.decision}`,
    });

    await writeStore(store);

    return VerificationRecordSchema.parse(verification);
  });

export const setStudentAccessForVerificationFromFile = async (
  verificationId: string,
  state: StudentAccessState,
) =>
  queueStoreOperation(async () => {
    const store = await readStore();
    const verification = requireVerification(store.verifications, verificationId);
    const now = new Date().toISOString();
    const isLocked = state === "locked";

    verification.updatedAt = now;
    verification.studentAccessState = state;
    verification.activity.push({
      type: "student_access_updated",
      recordedAt: now,
      message: isLocked
        ? "학생 링크를 잠금 처리했습니다."
        : "학생 링크를 다시 열었습니다.",
    });

    await writeStore(store);

    return VerificationRecordSchema.parse(verification);
  });

export const getVerificationRecordFromFile = async (verificationId: string) => {
  const store = await readStore();

  return (
    store.verifications.find((item) => item.verificationId === verificationId) ??
    null
  );
};

export const listVerificationRecordsFromFile = async () => {
  const store = await readStore();

  return sortByUpdatedAtDesc(store.verifications);
};

export const getOperatorSummaryFromFile = async (): Promise<OperatorSummary> => {
  const records = await listVerificationRecordsFromFile();

  const classificationCounts = new Map<string, number>();
  const teacherDecisionCounts = new Map<string, number>();
  const missingConceptCounts = new Map<string, number>();
  const misconceptionCounts = new Map<string, number>();

  for (const record of records) {
    if (record.analysisReport) {
      incrementBucket(classificationCounts, record.analysisReport.classification);

      for (const missingConcept of record.analysisReport.conceptCoverage
        .missingConcepts) {
        incrementBucket(missingConceptCounts, missingConcept);
      }

      for (const misconception of record.analysisReport.misconceptionLabels) {
        incrementBucket(misconceptionCounts, misconception);
      }
    }

    if (record.teacherDecision) {
      incrementBucket(teacherDecisionCounts, record.teacherDecision.decision);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalVerifications: records.length,
    analyzedVerifications: records.filter((record) => Boolean(record.analysisReport))
      .length,
    teacherDecisions: records.filter((record) => Boolean(record.teacherDecision))
      .length,
    classificationCounts: buildBuckets(classificationCounts),
    teacherDecisionCounts: buildBuckets(teacherDecisionCounts),
    topMissingConcepts: buildBuckets(missingConceptCounts),
    topMisconceptions: buildBuckets(misconceptionCounts),
    recentVerifications: records.slice(0, 8).map((record) => ({
      verificationId: record.verificationId,
      assignmentTitle: record.assignmentTitle,
      updatedAt: record.updatedAt,
      classification: record.analysisReport?.classification,
      teacherDecision: record.teacherDecision?.decision,
    })),
  };
};

export const exportVerificationsAsJsonFromFile = async (
  verificationId?: string,
) => {
  const records = await listVerificationRecordsFromFile();

  return verificationId
    ? records.filter((record) => record.verificationId === verificationId)
    : records;
};

const csvEscape = (value: string) => `"${value.replaceAll('"', '""')}"`;

export const exportVerificationsAsCsvFromFile = async (
  verificationId?: string,
) => {
  const records = verificationId
    ? await exportVerificationsAsJsonFromFile(verificationId)
    : await listVerificationRecordsFromFile();

  const header = [
    "verification_id",
    "assignment_title",
    "created_at",
    "updated_at",
    "classification",
    "confidence_band",
    "teacher_decision",
    "missing_concepts",
    "misconception_labels",
    "teacher_notes",
  ];

  const rows = records.map((record) => [
    record.verificationId,
    record.assignmentTitle,
    record.createdAt,
    record.updatedAt,
    record.analysisReport?.classification ?? "",
    record.analysisReport?.confidenceBand ?? "",
    record.teacherDecision?.decision ?? "",
    record.analysisReport?.conceptCoverage.missingConcepts.join(" | ") ?? "",
    record.analysisReport?.misconceptionLabels.join(" | ") ?? "",
    record.teacherDecision?.notes ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\n");
};
