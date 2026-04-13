import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAnalyzeRequest,
  buildInitialArtifacts,
  mergeVoiceText,
  normalizeTranscript,
  speechErrorMessage,
  uniqueNotes,
} from "@/lib/student-answer-flow";
import type { StudentVerificationSession } from "@/lib/schemas";

const verificationFixture: StudentVerificationSession = {
  verificationId: "verification-1",
  assignmentTitle: "이진 탐색 설명",
  assignmentDescription: "학생이 이진 탐색을 설명한다.",
  rubricCoreConcepts: ["정렬", "탐색 범위 축소"],
  sessionPreferences: {
    studentResponseMode: "voice_or_text",
    preferredExportFormat: "csv",
    allowMockFallback: true,
  },
  studentAccessState: "open",
  hasSubmitted: false,
  questionSet: {
    questionSetId: "question-set-1",
    generatedAt: "2026-04-13T12:00:00.000Z",
    promptVersion: "prompt.v1",
    modelVersion: "model.v1",
    overallStrategy: "핵심 전제와 범위 축소를 묻는다.",
    cautionNotes: [],
    questions: [
      {
        type: "why",
        question: "왜 정렬이 필요합니까?",
        intent: "전제 이해 확인",
        targetConcepts: ["정렬"],
        riskSignals: [],
      },
      {
        type: "transfer",
        question: "조건이 바뀌면 어떻게 됩니까?",
        intent: "전이 확인",
        targetConcepts: ["탐색 범위 축소"],
        riskSignals: [],
      },
      {
        type: "counterexample",
        question: "언제 성립하지 않습니까?",
        intent: "반례 확인",
        targetConcepts: ["정렬"],
        riskSignals: [],
      },
    ],
  },
};

test("normalizeTranscript trims spacing and records normalization notes", () => {
  const result = normalizeTranscript("  첫 문장\n두 번째 문장  !  ");

  assert.equal(result.text, "첫 문장 두 번째 문장!");
  assert.deepEqual(result.notes, [
    "전사 텍스트의 공백과 줄바꿈을 정리했습니다.",
    "구두점 앞 공백을 정리했습니다.",
  ]);
});

test("mergeVoiceText appends transcript without losing existing text", () => {
  assert.equal(mergeVoiceText("", "새로운 전사"), "새로운 전사");
  assert.equal(
    mergeVoiceText("기존 답변", "새로운 전사"),
    "기존 답변 새로운 전사",
  );
});

test("uniqueNotes removes duplicate normalization notes", () => {
  assert.deepEqual(uniqueNotes(["a", "a", "b", ""]), ["a", "b"]);
});

test("speechErrorMessage maps recognition errors to actionable Korean copy", () => {
  assert.match(speechErrorMessage("network"), /네트워크 오류/);
  assert.match(speechErrorMessage("not-allowed"), /권한/);
  assert.match(speechErrorMessage("unknown"), /오류/);
});

test("buildInitialArtifacts preserves stored voice metadata", () => {
  const artifacts = buildInitialArtifacts({
    ...verificationFixture,
    studentAnswers: [
      {
        type: "why",
        answer: "정렬되어 있어야 절반을 버릴 수 있습니다.",
        inputMethod: "voice",
        rawTranscript: "정렬되어 있어야 절반을 버릴 수 있습니다",
        normalizationNotes: ["구두점 앞 공백을 정리했습니다."],
        editedAfterTranscription: true,
      },
      {
        type: "transfer",
        answer: "조건에 따라 탐색 규칙이 달라집니다.",
        inputMethod: "text",
      },
      {
        type: "counterexample",
        answer: "정렬되지 않으면 성립하지 않습니다.",
        inputMethod: "text",
      },
    ],
  });

  assert.equal(artifacts.why.inputMethod, "voice");
  assert.equal(
    artifacts.why.rawTranscript,
    "정렬되어 있어야 절반을 버릴 수 있습니다",
  );
  assert.equal(artifacts.why.editedAfterTranscription, true);
});

test("buildAnalyzeRequest serializes answer artifacts into the analyze payload", () => {
  const payload = buildAnalyzeRequest({
    verification: verificationFixture,
    questionSet: verificationFixture.questionSet,
    answers: {
      why: "정렬된 배열이어야 절반을 버릴 수 있습니다.",
      transfer: "조건이 바뀌면 비교 기준도 바뀝니다.",
      counterexample: "정렬되지 않으면 성립하지 않습니다.",
    },
    answerArtifacts: {
      why: {
        inputMethod: "voice",
        rawTranscript: "정렬된 배열이어야 절반을 버릴 수 있습니다",
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
  });

  assert.equal(payload.studentAnswers.length, 3);
  assert.equal(payload.studentAnswers[0].inputMethod, "voice");
  assert.equal(
    payload.studentAnswers[0].rawTranscript,
    "정렬된 배열이어야 절반을 버릴 수 있습니다",
  );
  assert.deepEqual(payload.studentAnswers[0].normalizationNotes, [
    "구두점 앞 공백을 정리했습니다.",
  ]);
  assert.equal(payload.verificationId, "verification-1");
});
