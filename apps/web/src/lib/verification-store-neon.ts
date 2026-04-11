import "server-only";

import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";

import type {
  AnalysisReport,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetRequest,
  OperatorSummary,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationRecord,
} from "@/lib/schemas";
import { VerificationRecordSchema } from "@/lib/schemas";

type VerificationRow = {
  verification_id: string;
  assignment_title: string;
  assignment_description: string;
  rubric_core_concepts_json: string;
  rubric_risk_points_json: string;
  submission_text: string;
  question_set_json: string;
  student_answers_json: string | null;
  analysis_report_json: string | null;
  teacher_decision_json: string | null;
  activity_json: string;
  created_at: string;
  updated_at: string;
};

const getSql = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }

  return neon(databaseUrl);
};

let schemaReady: Promise<void> | null = null;

const ensureSchema = async () => {
  if (schemaReady) {
    return schemaReady;
  }

  schemaReady = (async () => {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS verification_records (
        verification_id TEXT PRIMARY KEY,
        assignment_title TEXT NOT NULL,
        assignment_description TEXT NOT NULL,
        rubric_core_concepts_json TEXT NOT NULL,
        rubric_risk_points_json TEXT NOT NULL,
        submission_text TEXT NOT NULL,
        question_set_json TEXT NOT NULL,
        student_answers_json TEXT,
        analysis_report_json TEXT,
        teacher_decision_json TEXT,
        activity_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;
  })();

  return schemaReady;
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

const rowToVerificationRecord = (row: VerificationRow) =>
  VerificationRecordSchema.parse({
    verificationId: row.verification_id,
    assignmentTitle: row.assignment_title,
    assignmentDescription: row.assignment_description,
    rubricCoreConcepts: JSON.parse(row.rubric_core_concepts_json),
    rubricRiskPoints: JSON.parse(row.rubric_risk_points_json),
    submissionText: row.submission_text,
    questionSet: JSON.parse(row.question_set_json),
    studentAnswers: row.student_answers_json
      ? JSON.parse(row.student_answers_json)
      : undefined,
    analysisReport: row.analysis_report_json
      ? JSON.parse(row.analysis_report_json)
      : undefined,
    teacherDecision: row.teacher_decision_json
      ? JSON.parse(row.teacher_decision_json)
      : undefined,
    activity: JSON.parse(row.activity_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const persistVerificationRecord = async (record: VerificationRecord) => {
  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO verification_records (
      verification_id,
      assignment_title,
      assignment_description,
      rubric_core_concepts_json,
      rubric_risk_points_json,
      submission_text,
      question_set_json,
      student_answers_json,
      analysis_report_json,
      teacher_decision_json,
      activity_json,
      created_at,
      updated_at
    ) VALUES (
      ${record.verificationId},
      ${record.assignmentTitle},
      ${record.assignmentDescription},
      ${JSON.stringify(record.rubricCoreConcepts)},
      ${JSON.stringify(record.rubricRiskPoints)},
      ${record.submissionText},
      ${JSON.stringify(record.questionSet)},
      ${record.studentAnswers ? JSON.stringify(record.studentAnswers) : null},
      ${record.analysisReport ? JSON.stringify(record.analysisReport) : null},
      ${record.teacherDecision ? JSON.stringify(record.teacherDecision) : null},
      ${JSON.stringify(record.activity)},
      ${record.createdAt},
      ${record.updatedAt}
    )
    ON CONFLICT (verification_id)
    DO UPDATE SET
      assignment_title = EXCLUDED.assignment_title,
      assignment_description = EXCLUDED.assignment_description,
      rubric_core_concepts_json = EXCLUDED.rubric_core_concepts_json,
      rubric_risk_points_json = EXCLUDED.rubric_risk_points_json,
      submission_text = EXCLUDED.submission_text,
      question_set_json = EXCLUDED.question_set_json,
      student_answers_json = EXCLUDED.student_answers_json,
      analysis_report_json = EXCLUDED.analysis_report_json,
      teacher_decision_json = EXCLUDED.teacher_decision_json,
      activity_json = EXCLUDED.activity_json,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at
  `;
};

export const createVerificationRecordFromNeon = async (
  input: GenerateQuestionSetRequest,
  questionSet: VerificationRecord["questionSet"],
) => {
  const now = new Date().toISOString();

  const verification = VerificationRecordSchema.parse({
    verificationId: randomUUID(),
    createdAt: now,
    updatedAt: now,
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

  await persistVerificationRecord(verification);

  return verification;
};

export const listVerificationRecordsFromNeon = async () => {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT *
    FROM verification_records
    ORDER BY updated_at DESC
  `) as VerificationRow[];

  return sortByUpdatedAtDesc(rows.map(rowToVerificationRecord));
};

export const getVerificationRecordFromNeon = async (verificationId: string) => {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT *
    FROM verification_records
    WHERE verification_id = ${verificationId}
    LIMIT 1
  `) as VerificationRow[];

  if (rows.length === 0) {
    return null;
  }

  return rowToVerificationRecord(rows[0]);
};

export const saveAnalysisForVerificationFromNeon = async (
  input: AnalyzeUnderstandingStoredRequest,
  analysisReport: AnalysisReport,
) => {
  const records = await listVerificationRecordsFromNeon();
  const verification = requireVerification(records, input.verificationId);
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

  await persistVerificationRecord(verification);

  return verification;
};

export const saveTeacherDecisionForVerificationFromNeon = async (
  verificationId: string,
  decisionInput: TeacherDecisionInput,
) => {
  const records = await listVerificationRecordsFromNeon();
  const verification = requireVerification(records, verificationId);
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

  await persistVerificationRecord(verification);

  return verification;
};

export const getOperatorSummaryFromNeon = async (): Promise<OperatorSummary> => {
  const records = await listVerificationRecordsFromNeon();

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

export const exportVerificationsAsJsonFromNeon = async () =>
  listVerificationRecordsFromNeon();

const csvEscape = (value: string) => `"${value.replaceAll('"', '""')}"`;

export const exportVerificationsAsCsvFromNeon = async () => {
  const records = await listVerificationRecordsFromNeon();

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
