import assert from "node:assert/strict";
import test from "node:test";

import {
  answersFromStoredAnswers,
  artifactsFromStoredAnswers,
  buildSessionStatus,
  buildStudentAnswers,
  buildTeacherDraftPayload,
  buildVerificationInput,
  createTeacherDraftSnapshot,
  equalTeacherDraftPayload,
  hasTeacherDraftContent,
  parseMultilineInput,
} from "@/lib/teacher-workbench";
import type { QuestionSet } from "@/lib/schemas";

const questionSetFixture: QuestionSet = {
  questionSetId: "question-set-1",
  generatedAt: "2026-04-13T12:00:00.000Z",
  promptVersion: "prompt.v1",
  modelVersion: "model.v1",
  overallStrategy: "Check explanation structure and transfer ability.",
  cautionNotes: [],
  questions: [
    {
      type: "why",
      question: "Why does the approach work?",
      intent: "Check first-principles understanding.",
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
};

test("parseMultilineInput removes blank lines and trims each item", () => {
  assert.deepEqual(parseMultilineInput(" sorted array \n\n binary search \n"), [
    "sorted array",
    "binary search",
  ]);
});

test("buildVerificationInput creates schema-ready teacher input", () => {
  const input = buildVerificationInput({
    assignmentTitle: "Explain binary search",
    assignmentDescription: "Explain how binary search works.",
    rubricConcepts: "sorted array\nsearch range reduction",
    riskPoints: "missing sorted-array prerequisite\nwrong time complexity",
    submissionText: "Binary search repeatedly cuts the search range in half.",
  });

  assert.deepEqual(input.rubricCoreConcepts, [
    "sorted array",
    "search range reduction",
  ]);
  assert.deepEqual(input.rubricRiskPoints, [
    "missing sorted-array prerequisite",
    "wrong time complexity",
  ]);
});

test("teacher draft helpers preserve payload shape and detect content", () => {
  const payload = buildTeacherDraftPayload({
    assignmentTitle: "Explain binary search",
    assignmentDescription: "Explain how binary search works.",
    rubricConcepts: "sorted array",
    riskPoints: "",
    submissionText: "Binary search repeatedly cuts the search range in half.",
  });

  const snapshot = createTeacherDraftSnapshot(
    payload,
    "2026-04-13T12:40:00.000Z",
  );

  assert.equal(snapshot.assignmentTitle, payload.assignmentTitle);
  assert.equal(snapshot.savedAt, "2026-04-13T12:40:00.000Z");
  assert.equal(hasTeacherDraftContent(payload), true);
  assert.equal(
    hasTeacherDraftContent({
      assignmentTitle: "",
      assignmentDescription: " ",
      rubricConcepts: "\n",
      riskPoints: "",
      submissionText: "",
    }),
    false,
  );
});

test("equalTeacherDraftPayload compares teacher input payloads without savedAt", () => {
  const left = {
    assignmentTitle: "Explain binary search",
    assignmentDescription: "Explain how binary search works.",
    rubricConcepts: "sorted array",
    riskPoints: "wrong time complexity",
    submissionText: "Binary search repeatedly cuts the search range in half.",
  };

  assert.equal(equalTeacherDraftPayload(left, { ...left }), true);
  assert.equal(
    equalTeacherDraftPayload(left, {
      ...left,
      submissionText: "A different submission body",
    }),
    false,
  );
});

test("answersFromStoredAnswers and artifactsFromStoredAnswers map saved answers by type", () => {
  const answers = [
    {
      type: "why" as const,
      answer: "Because the array is sorted.",
      inputMethod: "voice" as const,
      rawTranscript: "Because the array is sorted",
      normalizationNotes: ["trimmed punctuation"],
      editedAfterTranscription: true,
    },
    {
      type: "transfer" as const,
      answer: "The decision rule changes with the condition.",
      inputMethod: "text" as const,
    },
    {
      type: "counterexample" as const,
      answer: "It fails when the array is not sorted.",
      inputMethod: "text" as const,
    },
  ];

  const mappedAnswers = answersFromStoredAnswers(answers);
  const mappedArtifacts = artifactsFromStoredAnswers(answers);

  assert.equal(mappedAnswers.why, "Because the array is sorted.");
  assert.equal(mappedArtifacts.why.inputMethod, "voice");
  assert.equal(mappedArtifacts.why.editedAfterTranscription, true);
});

test("buildStudentAnswers trims answers and carries metadata into request payload", () => {
  const studentAnswers = buildStudentAnswers(
    questionSetFixture,
    {
      why: " Because the array is sorted. ",
      transfer: "The decision rule changes with the condition.",
      counterexample: "It fails when the array is not sorted.",
    },
    {
      why: {
        inputMethod: "voice",
        rawTranscript: "Because the array is sorted",
        normalizationNotes: ["trimmed punctuation"],
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

  assert.equal(studentAnswers[0].answer, "Because the array is sorted.");
  assert.equal(studentAnswers[0].inputMethod, "voice");
  assert.equal(studentAnswers[0].editedAfterTranscription, true);
});

test("buildSessionStatus reflects the latest teacher-visible state", () => {
  assert.equal(
    buildSessionStatus({
      teacherDecision: {
        decision: "approved_understanding",
        notes: "Teacher approved the explanation.",
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
        teacherSummary: "Needs another pass.",
        reteachingPoints: [],
        riskFlags: [],
      },
      questionSet: null,
    }),
    "근거 검토 가능",
  );

  assert.equal(
    buildSessionStatus({
      teacherDecision: null,
      analysisReport: null,
      questionSet: questionSetFixture,
    }),
    "학생 응답 대기",
  );

  assert.equal(
    buildSessionStatus({
      teacherDecision: null,
      analysisReport: null,
      questionSet: null,
    }),
    "세션 준비 중",
  );
});

