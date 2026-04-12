import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = process.cwd();
const port = 3200 + Math.floor(Math.random() * 200);
const baseUrl = `http://127.0.0.1:${port}`;
const useRealAi = process.argv.includes("--live") || process.argv.includes("--live-ai");
const useManagedDb =
  process.argv.includes("--live") || process.argv.includes("--live-db");
const requestTimeoutMs = useRealAi ? 90_000 : 15_000;

const logs = { stdout: "", stderr: "" };
const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");

const readEnvFile = async (filename) => {
  try {
    const raw = await readFile(path.join(rootDir, filename), "utf8");
    const entries = {};

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const delimiterIndex = trimmed.indexOf("=");
      if (delimiterIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, delimiterIndex).trim();
      const value = trimmed.slice(delimiterIndex + 1).trim();
      entries[key] = value;
    }

    return entries;
  } catch {
    return {};
  }
};

const fetchWithTimeout = (url, init) =>
  fetch(url, {
    ...init,
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await delay(500);
  }

  throw new Error(`서버가 ${timeoutMs}ms 안에 준비되지 않았습니다.`);
};

const fetchJson = async (url, init) => {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();
  let data = null;

  if (text.length > 0) {
    data = JSON.parse(text);
  }

  return { response, data, text };
};

const tempDir = await mkdtemp(path.join(os.tmpdir(), "viva-smoke-"));
const storePath = path.join(tempDir, "verification-store.json");
const envFileEntries = useRealAi || useManagedDb ? await readEnvFile(".env.local") : {};

const serverEnv = {
  ...process.env,
  AI_API_KEY: useRealAi
    ? process.env.AI_API_KEY ?? envFileEntries.AI_API_KEY ?? ""
    : "",
  OPENAI_API_KEY: useRealAi
    ? process.env.OPENAI_API_KEY ?? envFileEntries.OPENAI_API_KEY ?? ""
    : "",
  DATABASE_URL: useManagedDb
    ? process.env.DATABASE_URL ?? envFileEntries.DATABASE_URL ?? ""
    : "",
  AI_FAST_MODEL: useRealAi
    ? process.env.AI_FAST_MODEL ?? envFileEntries.AI_FAST_MODEL ?? ""
    : process.env.AI_FAST_MODEL ?? "",
  AI_REASONING_MODEL: useRealAi
    ? process.env.AI_REASONING_MODEL ?? envFileEntries.AI_REASONING_MODEL ?? ""
    : process.env.AI_REASONING_MODEL ?? "",
  VERIFICATION_STORE_PATH: storePath,
};

const server = spawn(process.execPath, [nextBin, "start", "--port", String(port)], {
  cwd: rootDir,
  env: serverEnv,
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (chunk) => {
  logs.stdout += chunk.toString();
});

server.stderr.on("data", (chunk) => {
  logs.stderr += chunk.toString();
});

try {
  await waitForServer(`${baseUrl}/api/health`);

  const health = await fetchJson(`${baseUrl}/api/health`);
  assert.equal(health.response.status, 200);
  assert.equal(health.data.status, "ok");
  assert.equal(health.data.runtime.storeMode, useManagedDb ? "managed" : "file");

  const home = await fetchWithTimeout(`${baseUrl}/`);
  const teacher = await fetchWithTimeout(`${baseUrl}/teacher`);
  const operator = await fetchWithTimeout(`${baseUrl}/operator`);
  assert.equal(home.status, 200);
  assert.equal(teacher.status, 200);
  assert.equal(operator.status, 200);

  const questionBody = {
    assignmentTitle: "이진 탐색 알고리즘 설명",
    assignmentDescription:
      "학생은 이진 탐색 알고리즘의 전제 조건과 시간 복잡도를 설명한다.",
    rubricCoreConcepts: [
      "정렬된 배열 전제",
      "탐색 범위 절반 축소",
      "시간 복잡도 O(log n)",
    ],
    rubricRiskPoints: ["정렬 전제가 없으면 설명이 붕괴함"],
    submissionText:
      "이진 탐색은 정렬된 배열에서 가운데 값을 기준으로 절반씩 탐색 범위를 줄여 목표 값을 찾는다. 각 단계에서 탐색 범위가 절반으로 줄기 때문에 시간 복잡도는 O(log n)이다.",
  };

  const questions = await fetchJson(`${baseUrl}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(questionBody),
  });
  assert.equal(questions.response.status, 200, questions.text);
  assert.equal(questions.data.questionSet.questions.length, 3);
  if (useRealAi) {
    assert.notEqual(questions.data.questionSet.modelVersion, "mock-engine");
  } else {
    assert.equal(questions.data.questionSet.modelVersion, "mock-engine");
  }

  const verificationId = questions.data.verificationId;
  const studentPage = await fetchWithTimeout(`${baseUrl}/student/${verificationId}`);
  assert.equal(studentPage.status, 200);

  const verification = await fetchJson(`${baseUrl}/api/verifications/${verificationId}`);
  assert.equal(verification.response.status, 200);
  assert.equal(verification.data.verification.verificationId, verificationId);

  const analyze = await fetchJson(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      verificationId,
      ...questionBody,
      questionSet: questions.data.questionSet,
      studentAnswers: [
        {
          type: "why",
          answer: "정렬이 되어 있어야 가운데 값을 기준으로 어느 쪽 절반을 버릴지 결정할 수 있다.",
          inputMethod: "voice",
          rawTranscript:
            "정렬이 되어 있어야 가운데 값을 기준으로 어느 쪽 절반을 버릴지 결정할 수 있다",
          normalizationNotes: ["문장부호 추가 및 공백 정리"],
        },
        {
          type: "transfer",
          answer:
            "범위를 절반으로 줄이는 방식은 단조성이 있는 조건 탐색이나 파라메트릭 서치에도 응용할 수 있다.",
          inputMethod: "text",
        },
        {
          type: "counterexample",
          answer:
            "정렬되지 않은 배열이면 가운데 값을 보고 어느 쪽을 버릴지 알 수 없어서 설명이 성립하지 않는다.",
          inputMethod: "text",
        },
      ],
    }),
  });
  assert.equal(analyze.response.status, 200, analyze.text);
  assert.ok(analyze.data.analysisReport.classification);

  const decision = await fetchJson(`${baseUrl}/api/teacher-decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      verificationId,
      decision: {
        decision: "approved_understanding",
        notes: "핵심 개념과 반례 설명이 충분하다.",
      },
    }),
  });
  assert.equal(decision.response.status, 200, decision.text);
  assert.equal(decision.data.teacherDecision.decision, "approved_understanding");

  const summary = await fetchJson(`${baseUrl}/api/summary`);
  assert.equal(summary.response.status, 200);
  assert.ok(summary.data.totalVerifications >= 1);
  assert.ok(summary.data.teacherDecisions >= 1);

  const exportJson = await fetchWithTimeout(`${baseUrl}/api/export?format=json`);
  const exportCsv = await fetchWithTimeout(`${baseUrl}/api/export?format=csv`);
  const exportJsonText = await exportJson.text();
  const exportCsvText = await exportCsv.text();
  assert.equal(exportJson.status, 200);
  assert.equal(exportCsv.status, 200);
  assert.match(exportJson.headers.get("content-type") ?? "", /application\/json/);
  assert.match(exportCsv.headers.get("content-type") ?? "", /text\/csv/);
  assert.match(exportJsonText, new RegExp(verificationId));
  assert.match(exportCsvText, /verification_id/);

  console.log(
    JSON.stringify(
      {
        status: "ok",
        mode: useRealAi || useManagedDb ? "live" : "mock",
        port,
        verificationId,
        classification: analyze.data.analysisReport.classification,
        confidenceBand: analyze.data.analysisReport.confidenceBand,
        questionModel: questions.data.questionSet.modelVersion,
        analysisModel: analyze.data.analysisReport.modelVersion,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Smoke test failed.");
  console.error(logs.stdout);
  console.error(logs.stderr);
  throw error;
} finally {
  server.kill();
  await rm(tempDir, { recursive: true, force: true });
}
