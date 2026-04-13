import "server-only";

import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";

import type {
  AnalysisReport,
  AnalyzeSubmissionRequest,
  GenerateQuestionSetRequest,
  OperatorSummary,
  StudentAccessState,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationRecord,
} from "@/lib/schemas";
import { VerificationRecordSchema } from "@/lib/schemas";
import { getRuntimeConfig } from "@/lib/runtime-config";

type VerificationRow = {
  verification_id: string;
  assignment_title: string;
  assignment_description: string;
  rubric_core_concepts_json: unknown;
  rubric_risk_points_json: unknown;
  submission_text: string;
  session_preferences_json: unknown;
  question_set_json: unknown;
  student_answers_json: unknown | null;
  analysis_report_json: unknown | null;
  teacher_decision_json: unknown | null;
  activity_json: unknown;
  student_access_state: string;
  created_at: string | Date;
  updated_at: string | Date;
};

const getSql = () => {
  const { databaseUrl } = getRuntimeConfig();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
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
        rubric_core_concepts_json JSONB NOT NULL,
        rubric_risk_points_json JSONB NOT NULL,
        submission_text TEXT NOT NULL,
        session_preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        question_set_json JSONB NOT NULL,
        student_answers_json JSONB,
        analysis_report_json JSONB,
        teacher_decision_json JSONB,
        activity_json JSONB NOT NULL,
        student_access_state TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `;

    await sql`
      ALTER TABLE verification_records
      ADD COLUMN IF NOT EXISTS student_access_state TEXT NOT NULL DEFAULT 'open'
    `;

    await sql`
      ALTER TABLE verification_records
      ADD COLUMN IF NOT EXISTS session_preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS verification_records_updated_at_idx
      ON verification_records (updated_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS verification_records_student_access_state_idx
      ON verification_records (student_access_state)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS verification_records_created_at_idx
      ON verification_records (created_at DESC)
    `;
  })();

  return schemaReady;
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

const parseJsonColumn = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
};

const normalizeTimestamp = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const rowToVerificationRecord = (row: VerificationRow) =>
  VerificationRecordSchema.parse({
    verificationId: row.verification_id,
    assignmentTitle: row.assignment_title,
    assignmentDescription: row.assignment_description,
    rubricCoreConcepts: parseJsonColumn<string[]>(row.rubric_core_concepts_json, []),
    rubricRiskPoints: parseJsonColumn<string[]>(row.rubric_risk_points_json, []),
    submissionText: row.submission_text,
    sessionPreferences: parseJsonColumn(row.session_preferences_json, {}),
    questionSet: parseJsonColumn(row.question_set_json, null),
    studentAnswers: row.student_answers_json
      ? parseJsonColumn(row.student_answers_json, undefined)
      : undefined,
    analysisReport: row.analysis_report_json
      ? parseJsonColumn(row.analysis_report_json, undefined)
      : undefined,
    teacherDecision: row.teacher_decision_json
      ? parseJsonColumn(row.teacher_decision_json, undefined)
      : undefined,
    activity: parseJsonColumn(row.activity_json, []),
    studentAccessState: row.student_access_state,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
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
      session_preferences_json,
      question_set_json,
      student_answers_json,
      analysis_report_json,
      teacher_decision_json,
      activity_json,
      student_access_state,
      created_at,
      updated_at
    ) VALUES (
      ${record.verificationId},
      ${record.assignmentTitle},
      ${record.assignmentDescription},
      ${JSON.stringify(record.rubricCoreConcepts)},
      ${JSON.stringify(record.rubricRiskPoints)},
      ${record.submissionText},
      ${JSON.stringify(record.sessionPreferences)},
      ${JSON.stringify(record.questionSet)},
      ${record.studentAnswers ? JSON.stringify(record.studentAnswers) : null},
      ${record.analysisReport ? JSON.stringify(record.analysisReport) : null},
      ${record.teacherDecision ? JSON.stringify(record.teacherDecision) : null},
      ${JSON.stringify(record.activity)},
      ${record.studentAccessState},
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
      session_preferences_json = EXCLUDED.session_preferences_json,
      question_set_json = EXCLUDED.question_set_json,
      student_answers_json = EXCLUDED.student_answers_json,
      analysis_report_json = EXCLUDED.analysis_report_json,
      teacher_decision_json = EXCLUDED.teacher_decision_json,
      activity_json = EXCLUDED.activity_json,
      student_access_state = EXCLUDED.student_access_state,
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
    studentAccessState: "open",
    ...input,
    sessionPreferences: input.sessionPreferences,
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
  input: AnalyzeSubmissionRequest,
  analysisReport: AnalysisReport,
) => {
  const verification = await getVerificationRecordFromNeon(input.verificationId);

  if (!verification) {
    throw new Error("해당 검증 세션을 찾을 수 없습니다.");
  }
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
  const verification = await getVerificationRecordFromNeon(verificationId);

  if (!verification) {
    throw new Error("해당 검증 세션을 찾을 수 없습니다.");
  }
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

export const setStudentAccessForVerificationFromNeon = async (
  verificationId: string,
  state: StudentAccessState,
) => {
  const verification = await getVerificationRecordFromNeon(verificationId);

  if (!verification) {
    throw new Error("해당 검증 세션을 찾을 수 없습니다.");
  }
  const now = new Date().toISOString();

  verification.updatedAt = now;
  verification.studentAccessState = state;
  verification.activity.push({
    type: "student_access_updated",
    recordedAt: now,
    message:
      state === "locked"
        ? "학생 링크를 잠금 처리했습니다."
        : "학생 링크를 다시 열었습니다.",
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

export const exportVerificationsAsJsonFromNeon = async (
  verificationId?: string,
) => {
  const records = await listVerificationRecordsFromNeon();

  return verificationId
    ? records.filter((record) => record.verificationId === verificationId)
    : records;
};

const csvEscape = (value: string) => `"${value.replaceAll('"', '""')}"`;

export const exportVerificationsAsCsvFromNeon = async (
  verificationId?: string,
) => {
  const records = verificationId
    ? await exportVerificationsAsJsonFromNeon(verificationId)
    : await listVerificationRecordsFromNeon();

  const header = [
    "verification_id",
    "assignment_title",
    "created_at",
    "updated_at",
    "student_response_mode",
    "preferred_export_format",
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
    record.sessionPreferences.studentResponseMode,
    record.sessionPreferences.preferredExportFormat,
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
