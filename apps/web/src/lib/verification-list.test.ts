import assert from "node:assert/strict";
import test from "node:test";

import { filterVerificationList, toVerificationListItem } from "@/lib/verification-list";
import type { VerificationRecord } from "@/lib/schemas";

const buildRecord = (
  overrides: Partial<VerificationRecord>,
): VerificationRecord => ({
  verificationId: "verification-1",
  assignmentTitle: "이진 탐색 설명",
  assignmentDescription: "학생이 이진 탐색을 설명한다.",
  rubricCoreConcepts: ["정렬", "탐색 범위 축소"],
  rubricRiskPoints: ["정렬 전제 누락"],
  submissionText: "제출물 본문",
  createdAt: "2026-04-13T12:00:00.000Z",
  updatedAt: "2026-04-13T12:30:00.000Z",
  questionSet: {
    questionSetId: "question-set-1",
    generatedAt: "2026-04-13T12:00:00.000Z",
    promptVersion: "prompt.v1",
    modelVersion: "mock-engine",
    overallStrategy: "전략",
    cautionNotes: [],
    questions: [
      {
        type: "why",
        question: "왜 그런가요?",
        intent: "이유",
        targetConcepts: ["정렬"],
        riskSignals: [],
      },
      {
        type: "transfer",
        question: "조건이 바뀌면 어떻게 되나요?",
        intent: "전이",
        targetConcepts: ["탐색 범위 축소"],
        riskSignals: [],
      },
      {
        type: "counterexample",
        question: "언제 성립하지 않나요?",
        intent: "반례",
        targetConcepts: ["정렬"],
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
        teacherSummary: "요약",
        reteachingPoints: [],
        riskFlags: [],
      },
    }),
  );

  assert.equal(item.questionModelVersion, "mock-engine");
  assert.equal(item.analysisModelVersion, "educator-verification-v1");
  assert.equal(item.classification, "uncertain");
});

test("filterVerificationList matches title, concept, and verification id", () => {
  const records = [
    buildRecord({ verificationId: "verification-1" }),
    buildRecord({
      verificationId: "verification-2",
      assignmentTitle: "정렬 알고리즘 설명",
      assignmentDescription: "학생이 병합 정렬을 설명한다.",
      rubricCoreConcepts: ["병합 정렬"],
    }),
  ];

  assert.equal(filterVerificationList(records, "이진 탐색", 10).length, 1);
  assert.equal(filterVerificationList(records, "병합 정렬", 10).length, 1);
  assert.equal(filterVerificationList(records, "verification-2", 10).length, 1);
  assert.equal(filterVerificationList(records, "", 1).length, 1);
});
