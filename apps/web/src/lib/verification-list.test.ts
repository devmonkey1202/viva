import assert from "node:assert/strict";
import test from "node:test";

import {
  filterVerificationList,
  getVerificationSessionFilter,
  matchesVerificationSessionFilter,
  toVerificationListItem,
} from "@/lib/verification-list";
import type { VerificationRecord } from "@/lib/schemas";

const buildRecord = (
  overrides: Partial<VerificationRecord>,
): VerificationRecord => ({
  verificationId: "verification-1",
  assignmentTitle: "Explain binary search",
  assignmentDescription: "Student explains binary search.",
  rubricCoreConcepts: ["sorted array", "search range reduction"],
  rubricRiskPoints: ["missing sorted-array prerequisite"],
  submissionText: "Binary search repeatedly cuts the search range in half.",
  createdAt: "2026-04-13T12:00:00.000Z",
  updatedAt: "2026-04-13T12:30:00.000Z",
  studentAccessState: "open",
  questionSet: {
    questionSetId: "question-set-1",
    generatedAt: "2026-04-13T12:00:00.000Z",
    promptVersion: "prompt.v1",
    modelVersion: "mock-engine",
    overallStrategy: "Check explanation structure and transfer ability.",
    cautionNotes: [],
    questions: [
      {
        type: "why",
        question: "Why does the approach work?",
        intent: "Check understanding.",
        targetConcepts: ["sorted array"],
        riskSignals: [],
      },
      {
        type: "transfer",
        question: "What changes if the condition changes?",
        intent: "Check transfer ability.",
        targetConcepts: ["search range reduction"],
        riskSignals: [],
      },
      {
        type: "counterexample",
        question: "When would this explanation stop holding?",
        intent: "Check limits and failure conditions.",
        targetConcepts: ["sorted array"],
        riskSignals: [],
      },
    ],
  },
  activity: [],
  ...overrides,
});

test("toVerificationListItem keeps teacher-facing summary fields", () => {
  const item = toVerificationListItem(
    buildRecord({
      analysisReport: {
        analysisId: "analysis-1",
        generatedAt: "2026-04-13T12:20:00.000Z",
        promptVersion: "prompt.v1",
        modelVersion: "educator-verification-v1",
        classification: "uncertain",
        confidenceBand: "medium",
        semanticAlignment: { status: "aligned", evidence: [] },
        conceptCoverage: { coveredConcepts: [], missingConcepts: [] },
        transferAbility: { status: "partial", evidence: [] },
        contradictionCheck: { status: "none", contradictions: [] },
        misconceptionLabels: [],
        teacherSummary: "Need another pass.",
        reteachingPoints: [],
        riskFlags: [],
      },
    }),
  );

  assert.equal(item.questionModelVersion, "mock-engine");
  assert.equal(item.analysisModelVersion, "educator-verification-v1");
  assert.equal(item.classification, "uncertain");
  assert.equal(item.studentAccessState, "open");
});

test("filterVerificationList matches title, concept, and verification id", () => {
  const records = [
    buildRecord({ verificationId: "verification-1" }),
    buildRecord({
      verificationId: "verification-2",
      assignmentTitle: "Explain merge sort",
      assignmentDescription: "Student explains merge sort.",
      rubricCoreConcepts: ["merge sort"],
    }),
  ];

  assert.equal(filterVerificationList(records, "binary search", 10).length, 1);
  assert.equal(filterVerificationList(records, "merge sort", 10).length, 1);
  assert.equal(filterVerificationList(records, "verification-2", 10).length, 1);
  assert.equal(filterVerificationList(records, "", 1).length, 1);
});

test("getVerificationSessionFilter classifies session states for browser filters", () => {
  const awaiting = toVerificationListItem(buildRecord({}));
  const analyzed = toVerificationListItem(
    buildRecord({
      analysisReport: {
        analysisId: "analysis-1",
        generatedAt: "2026-04-13T12:20:00.000Z",
        promptVersion: "prompt.v1",
        modelVersion: "educator-verification-v1",
        classification: "uncertain",
        confidenceBand: "medium",
        semanticAlignment: { status: "aligned", evidence: [] },
        conceptCoverage: { coveredConcepts: [], missingConcepts: [] },
        transferAbility: { status: "partial", evidence: [] },
        contradictionCheck: { status: "none", contradictions: [] },
        misconceptionLabels: [],
        teacherSummary: "Need another pass.",
        reteachingPoints: [],
        riskFlags: [],
      },
    }),
  );
  const decided = toVerificationListItem(
    buildRecord({
      teacherDecision: {
        decision: "approved_understanding",
        notes: "Teacher approved the explanation.",
        decidedAt: "2026-04-13T12:40:00.000Z",
      },
    }),
  );

  assert.equal(getVerificationSessionFilter(awaiting), "awaiting_answers");
  assert.equal(getVerificationSessionFilter(analyzed), "analysis_ready");
  assert.equal(getVerificationSessionFilter(decided), "decision_complete");
  assert.equal(matchesVerificationSessionFilter(decided, "decision_complete"), true);
  assert.equal(matchesVerificationSessionFilter(awaiting, "analysis_ready"), false);
});
