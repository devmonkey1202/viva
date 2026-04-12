import assert from "node:assert/strict";
import test from "node:test";

import {
  answersFromStoredAnswers,
  artifactsFromStoredAnswers,
  buildSessionStatus,
  buildStudentAnswers,
  buildVerificationInput,
  parseMultilineInput,
} from "@/lib/teacher-workbench";
import type { QuestionSet } from "@/lib/schemas";

const questionSetFixture: QuestionSet = {
  questionSetId: "question-set-1",
  generatedAt: "2026-04-13T12:00:00.000Z",
  promptVersion: "prompt.v1",
  modelVersion: "model.v1",
  overallStrategy: "핵심 개념과 반례를 동시에 확인한다.",
  cautionNotes: [],
  questions: [
    {
      type: "why",
      question: "왜 그런가요?",
      intent: "이유를 확인한다.",
      targetConcepts: ["정렬"],
      riskSignals: [],
    },
    {
      type: "transfer",
      question: "조건이 바뀌면 어떻게 되나요?",
      intent: "전이를 확인한다.",
      targetConcepts: ["탐색 범위 축소"],
      riskSignals: [],
    },
    {
      type: "counterexample",
      question: "언제 성립하지 않나요?",
      intent: "반례를 확인한다.",
      targetConcepts: ["정렬"],
      riskSignals: [],
    },
  ],
};

test("parseMultilineInput removes blank lines and trims each item", () => {
  assert.deepEqual(parseMultilineInput(" 정렬 \n\n 탐색 범위 축소 \n"), [
    "정렬",
    "탐색 범위 축소",
  ]);
});

test("buildVerificationInput creates schema-ready teacher input", () => {
  const input = buildVerificationInput({
    assignmentTitle: "이진 탐색 설명",
    assignmentDescription: "설명 과제",
    rubricConcepts: "정렬\n탐색 범위 축소",
    riskPoints: "정렬 전제 누락\n시간 복잡도 누락",
    submissionText: "제출물 본문",
  });

  assert.deepEqual(input.rubricCoreConcepts, ["정렬", "탐색 범위 축소"]);
  assert.deepEqual(input.rubricRiskPoints, [
    "정렬 전제 누락",
    "시간 복잡도 누락",
  ]);
});

test("answersFromStoredAnswers and artifactsFromStoredAnswers map saved answers by type", () => {
  const answers = [
    {
      type: "why" as const,
      answer: "정렬되어 있어야 합니다.",
      inputMethod: "voice" as const,
      rawTranscript: "정렬되어 있어야 합니다",
      normalizationNotes: ["구두점 앞 공백을 정리했습니다."],
      editedAfterTranscription: true,
    },
    {
      type: "transfer" as const,
      answer: "조건에 따라 규칙이 달라집니다.",
      inputMethod: "text" as const,
    },
    {
      type: "counterexample" as const,
      answer: "정렬되지 않으면 성립하지 않습니다.",
      inputMethod: "text" as const,
    },
  ];

  const mappedAnswers = answersFromStoredAnswers(answers);
  const mappedArtifacts = artifactsFromStoredAnswers(answers);

  assert.equal(mappedAnswers.why, "정렬되어 있어야 합니다.");
  assert.equal(mappedArtifacts.why.inputMethod, "voice");
  assert.equal(mappedArtifacts.why.editedAfterTranscription, true);
});

test("buildStudentAnswers trims answers and carries metadata into request payload", () => {
  const studentAnswers = buildStudentAnswers(
    questionSetFixture,
    {
      why: " 정렬되어 있어야 합니다. ",
      transfer: "조건이 바뀌면 기준도 달라집니다.",
      counterexample: "정렬되지 않으면 성립하지 않습니다.",
    },
    {
      why: {
        inputMethod: "voice",
        rawTranscript: "정렬되어 있어야 합니다",
        normalizationNotes: ["구두점 앞 공백을 정리했습니다."],
        editedAfterTranscription: true,
      },
      transfer: {
        inputMethod: "text",
        normalizationNotes: [],
      },
      counterexample: {
        inputMethod: "text",
        normalizationNotes: [],
      },
    },
  );

  assert.equal(studentAnswers[0].answer, "정렬되어 있어야 합니다.");
  assert.equal(studentAnswers[0].inputMethod, "voice");
  assert.equal(studentAnswers[0].editedAfterTranscription, true);
});

test("buildSessionStatus reflects the latest teacher-visible state", () => {
  assert.equal(
    buildSessionStatus({
      teacherDecision: {
        decision: "approved_understanding",
        notes: "충분히 이해했다.",
        decidedAt: "2026-04-13T12:00:00.000Z",
      },
      analysisReport: null,
      questionSet: null,
    }),
    "교사 판단 완료",
  );

  assert.equal(
    buildSessionStatus({
      teacherDecision: null,
      analysisReport: {
        analysisId: "analysis-1",
        generatedAt: "2026-04-13T12:00:00.000Z",
        promptVersion: "prompt.v1",
        modelVersion: "model.v1",
        classification: "uncertain",
        confidenceBand: "medium",
        semanticAlignment: { status: "aligned", evidence: [] },
        conceptCoverage: { coveredConcepts: [], missingConcepts: [] },
        transferAbility: { status: "partial", evidence: [] },
        contradictionCheck: { status: "none", contradictions: [] },
        misconceptionLabels: [],
        teacherSummary: "추가 검토가 필요하다.",
        reteachingPoints: [],
        riskFlags: [],
      },
      questionSet: null,
    }),
    "근거 검토 가능",
  );
});
