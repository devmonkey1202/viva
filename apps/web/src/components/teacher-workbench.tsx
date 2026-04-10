"use client";

import { useDeferredValue, useState, useTransition } from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { demoAnswerDraft, demoVerificationInput } from "@/lib/demo-data";
import type {
  AnalysisReport,
  AnalyzeUnderstandingResponse,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetResponse,
  QuestionSet,
  QuestionType,
  SaveTeacherDecisionResponse,
  TeacherDecision,
  TeacherDecisionInput,
} from "@/lib/schemas";

type TeacherWorkbenchProps = {
  aiConfigured: boolean;
};

const classificationMeta: Record<
  AnalysisReport["classification"],
  { label: string; tone: "success" | "warning" | "danger" | "info" }
> = {
  sufficient_understanding: {
    label: "이해 충분",
    tone: "success",
  },
  surface_memorization: {
    label: "표면 암기",
    tone: "warning",
  },
  submission_dependency: {
    label: "제출물 의존",
    tone: "warning",
  },
  core_misconception: {
    label: "핵심 오개념",
    tone: "danger",
  },
  uncertain: {
    label: "불확실",
    tone: "info",
  },
};

const teacherDecisionMeta: Record<
  TeacherDecision["decision"],
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  approved_understanding: {
    label: "이해 승인",
    tone: "success",
  },
  needs_followup: {
    label: "후속 확인 필요",
    tone: "warning",
  },
  manual_review_required: {
    label: "수동 검토 필요",
    tone: "danger",
  },
};

const teacherDecisionOptions = Object.entries(teacherDecisionMeta) as Array<
  [TeacherDecision["decision"], (typeof teacherDecisionMeta)[TeacherDecision["decision"]]]
>;

const parseMultilineInput = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const initialAnswerState: Record<QuestionType, string> = {
  why: "",
  transfer: "",
  counterexample: "",
};

const initialDecisionState: TeacherDecisionInput = {
  decision: "approved_understanding",
  notes: "",
};

const formatQuestionType = (type: QuestionType) => {
  switch (type) {
    case "why":
      return "왜형";
    case "transfer":
      return "전이형";
    case "counterexample":
      return "반례형";
  }
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function TeacherWorkbench({ aiConfigured }: TeacherWorkbenchProps) {
  const [assignmentTitle, setAssignmentTitle] = useState(
    demoVerificationInput.assignmentTitle,
  );
  const [assignmentDescription, setAssignmentDescription] = useState(
    demoVerificationInput.assignmentDescription,
  );
  const [rubricConcepts, setRubricConcepts] = useState(
    demoVerificationInput.rubricCoreConcepts.join("\n"),
  );
  const [riskPoints, setRiskPoints] = useState(
    demoVerificationInput.rubricRiskPoints.join("\n"),
  );
  const [submissionText, setSubmissionText] = useState(
    demoVerificationInput.submissionText,
  );
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(
    null,
  );
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [teacherDecision, setTeacherDecision] = useState<TeacherDecision | null>(
    null,
  );
  const [decisionDraft, setDecisionDraft] =
    useState<TeacherDecisionInput>(initialDecisionState);
  const [answers, setAnswers] =
    useState<Record<QuestionType, string>>(initialAnswerState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<
    "questions" | "analysis" | "decision" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const deferredSubmissionText = useDeferredValue(submissionText);

  const verificationInput = {
    assignmentTitle,
    assignmentDescription,
    rubricCoreConcepts: parseMultilineInput(rubricConcepts),
    rubricRiskPoints: parseMultilineInput(riskPoints),
    submissionText,
  };

  const loadDemoAnswers = () => {
    setAnswers({
      why: demoAnswerDraft.why,
      transfer: demoAnswerDraft.transfer,
      counterexample: demoAnswerDraft.counterexample,
    });
  };

  const resetToDemo = () => {
    setAssignmentTitle(demoVerificationInput.assignmentTitle);
    setAssignmentDescription(demoVerificationInput.assignmentDescription);
    setRubricConcepts(demoVerificationInput.rubricCoreConcepts.join("\n"));
    setRiskPoints(demoVerificationInput.rubricRiskPoints.join("\n"));
    setSubmissionText(demoVerificationInput.submissionText);
    setQuestionSet(null);
    setAnalysisReport(null);
    setVerificationId(null);
    setTeacherDecision(null);
    setDecisionDraft(initialDecisionState);
    setAnswers(initialAnswerState);
    setErrorMessage(null);
  };

  const generateQuestions = () => {
    setErrorMessage(null);
    setActiveAction("questions");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/questions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(verificationInput),
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "질문 생성에 실패했습니다.");
          }

          const payload = (await response.json()) as GenerateQuestionSetResponse;
          setVerificationId(payload.verificationId);
          setQuestionSet(payload.questionSet);
          setAnalysisReport(null);
          setTeacherDecision(null);
          setDecisionDraft(initialDecisionState);
          setAnswers(initialAnswerState);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "질문 생성 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const runAnalysis = () => {
    if (!questionSet || !verificationId) {
      return;
    }

    setErrorMessage(null);
    setActiveAction("analysis");

    startTransition(() => {
      void (async () => {
        try {
          const analysisRequest: AnalyzeUnderstandingStoredRequest = {
            verificationId,
            ...verificationInput,
            questionSet,
            studentAnswers: questionSet.questions.map((question) => ({
              type: question.type,
              answer: answers[question.type].trim(),
            })),
          };

          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(analysisRequest),
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "이해 분석에 실패했습니다.");
          }

          const result = (await response.json()) as AnalyzeUnderstandingResponse;
          setVerificationId(result.verificationId);
          setAnalysisReport(result.analysisReport);
          setTeacherDecision(null);
          setDecisionDraft((current) => ({
            decision: current.decision,
            notes:
              current.notes.trim().length > 0
                ? current.notes
                : result.analysisReport.teacherSummary,
          }));
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "이해 분석 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const saveTeacherDecision = () => {
    if (!verificationId) {
      return;
    }

    setErrorMessage(null);
    setActiveAction("decision");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/teacher-decisions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              verificationId,
              decision: decisionDraft,
            }),
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "교사 판단 저장에 실패했습니다.");
          }

          const payload = (await response.json()) as SaveTeacherDecisionResponse;
          setVerificationId(payload.verificationId);
          setTeacherDecision(payload.teacherDecision);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "교사 판단 저장 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-[0_30px_80px_rgba(36,48,64,0.08)] backdrop-blur xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="accent">Teacher Console</StatusBadge>
            <StatusBadge tone={aiConfigured ? "success" : "warning"}>
              {aiConfigured ? "실제 AI 연결 가능" : "Mock fallback 모드"}
            </StatusBadge>
            <StatusBadge tone={verificationId ? "success" : "neutral"}>
              {verificationId ? "세션 저장 중" : "세션 미생성"}
            </StatusBadge>
          </div>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              제출물 이후의 이해 검증 흐름을 바로 실행합니다.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              교강사는 과제와 루브릭을 넣고, VIVA는 제출물 기반 질문을
              생성합니다. 이후 학생 답변을 분석해 교사가 최종 판단할 수 있는
              근거 중심 결과를 보여줍니다.
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,248,240,0.92),rgba(246,250,255,0.92))] p-5">
          <div className="grid gap-2 rounded-3xl border border-orange-200/70 bg-white/75 p-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange-700 uppercase">
              Current focus
            </p>
            <p className="text-sm leading-6 text-slate-700">
              핵심 시나리오가 끊기지 않는 배포형 교사 워크벤치를 먼저
              완성합니다.
            </p>
            {verificationId ? (
              <p className="text-xs leading-6 text-slate-500">
                verification id: {verificationId}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/api/export?format=json"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              JSON export
            </Link>
            <Link
              href="/api/export?format=csv"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              CSV export
            </Link>
            <Link
              href="/operator"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              운영자 요약 보기
            </Link>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={resetToDemo}
              className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              데모 입력값 다시 불러오기
            </button>
            <button
              type="button"
              onClick={generateQuestions}
              disabled={isPending}
              className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {activeAction === "questions" ? "질문 생성 중..." : "질문 3개 생성"}
            </button>
            <button
              type="button"
              onClick={loadDemoAnswers}
              disabled={!questionSet}
              className="rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              데모 답변 채우기
            </button>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={!questionSet || isPending}
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "analysis" ? "이해 분석 중..." : "이해 분석 실행"}
            </button>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Assignment Setup
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  과제와 루브릭 입력
                </h2>
              </div>
              <StatusBadge tone="neutral">교사 입력</StatusBadge>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">과제 제목</span>
                <input
                  value={assignmentTitle}
                  onChange={(event) => setAssignmentTitle(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">과제 설명</span>
                <textarea
                  value={assignmentDescription}
                  onChange={(event) => setAssignmentDescription(event.target.value)}
                  rows={4}
                  className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">핵심 개념</span>
                  <textarea
                    value={rubricConcepts}
                    onChange={(event) => setRubricConcepts(event.target.value)}
                    rows={6}
                    className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">취약 포인트</span>
                  <textarea
                    value={riskPoints}
                    onChange={(event) => setRiskPoints(event.target.value)}
                    rows={6}
                    className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </label>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Submission
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  학생 제출물
                </h2>
              </div>
              <StatusBadge tone="neutral">제출 기반</StatusBadge>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">제출물 본문</span>
              <textarea
                value={submissionText}
                onChange={(event) => setSubmissionText(event.target.value)}
                rows={12}
                className="rounded-[28px] border border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
              />
            </label>
            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Preview Focus
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {deferredSubmissionText}
              </p>
            </div>
          </article>
        </div>

        <div className="grid gap-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Verification Questions
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">AI 질문 3개</h2>
              </div>
              <StatusBadge tone={questionSet ? "accent" : "neutral"}>
                {questionSet ? "생성 완료" : "대기 중"}
              </StatusBadge>
            </div>

            {questionSet ? (
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-orange-200 bg-orange-50 px-4 py-4 text-sm leading-7 text-orange-900">
                  {questionSet.overallStrategy}
                </div>
                {questionSet.questions.map((question) => (
                  <div
                    key={question.type}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-950">
                        {formatQuestionType(question.type)} 질문
                      </h3>
                      <StatusBadge tone="neutral">{question.type}</StatusBadge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-800">{question.question}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      의도: {question.intent}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-500">
                과제, 루브릭, 제출물을 입력한 뒤 질문 생성 버튼을 누르면 왜형/전이형/반례형
                질문이 표시됩니다.
              </div>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Student Response
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">학생 답변 입력</h2>
              </div>
              <StatusBadge tone="neutral">90초 내외</StatusBadge>
            </div>

            {questionSet ? (
              <div className="grid gap-4">
                {questionSet.questions.map((question) => (
                  <label key={question.type} className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatQuestionType(question.type)} 답변
                    </span>
                    <textarea
                      value={answers[question.type]}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.type]: event.target.value,
                        }))
                      }
                      rows={4}
                      className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-500">
                질문이 생성되면 답변 입력 영역이 열립니다.
              </div>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Analysis Result
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">교사 판단 근거</h2>
              </div>
              <StatusBadge
                tone={
                  analysisReport
                    ? classificationMeta[analysisReport.classification].tone
                    : "neutral"
                }
              >
                {analysisReport
                  ? classificationMeta[analysisReport.classification].label
                  : "분석 전"}
              </StatusBadge>
            </div>

            {analysisReport ? (
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,250,242,0.9),rgba(244,248,255,0.9))] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone={classificationMeta[analysisReport.classification].tone}>
                      {classificationMeta[analysisReport.classification].label}
                    </StatusBadge>
                    <StatusBadge tone="neutral">신뢰도 {analysisReport.confidenceBand}</StatusBadge>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-800">
                    {analysisReport.teacherSummary}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">빠진 개념</h3>
                    <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                      {analysisReport.conceptCoverage.missingConcepts.length > 0 ? (
                        analysisReport.conceptCoverage.missingConcepts.map((concept) => (
                          <li key={concept}>• {concept}</li>
                        ))
                      ) : (
                        <li>• 빠진 개념이 두드러지지 않습니다.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">재설명 포인트</h3>
                    <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                      {analysisReport.reteachingPoints.map((point) => (
                        <li key={point}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">의미 정렬</h3>
                    <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                      {analysisReport.semanticAlignment.evidence.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">위험 신호</h3>
                    <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                      {analysisReport.riskFlags.length > 0 ? (
                        analysisReport.riskFlags.map((flag) => <li key={flag}>• {flag}</li>)
                      ) : (
                        <li>• 추가 위험 신호가 감지되지 않았습니다.</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">충돌 문장</h3>
                  {analysisReport.contradictionCheck.contradictions.length > 0 ? (
                    <div className="mt-3 grid gap-3">
                      {analysisReport.contradictionCheck.contradictions.map((item, index) => (
                        <div
                          key={`${item.submissionClaim}-${index}`}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        >
                          <p>제출물 주장: {item.submissionClaim}</p>
                          <p className="mt-1">답변 주장: {item.answerClaim}</p>
                          <p className="mt-2 text-slate-500">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-700">현재 두드러지는 충돌 문장은 없습니다.</p>
                  )}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        교사 최종 판단
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        AI 결과를 참고해 최종 판단을 저장합니다.
                      </p>
                    </div>
                    <StatusBadge tone={teacherDecision ? "success" : "warning"}>
                      {teacherDecision
                        ? teacherDecisionMeta[teacherDecision.decision].label
                        : "미저장"}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {teacherDecisionOptions.map(([decision, meta]) => (
                      <button
                        key={decision}
                        type="button"
                        onClick={() =>
                          setDecisionDraft((current) => ({
                            ...current,
                            decision,
                          }))
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          decisionDraft.decision === decision
                            ? "bg-slate-950 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-950"
                        }`}
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      교사 판단 메모
                    </span>
                    <textarea
                      value={decisionDraft.notes}
                      onChange={(event) =>
                        setDecisionDraft((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={4}
                      className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={saveTeacherDecision}
                      disabled={
                        isPending ||
                        !verificationId ||
                        decisionDraft.notes.trim().length === 0
                      }
                      className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {activeAction === "decision"
                        ? "교사 판단 저장 중..."
                        : "교사 판단 저장"}
                    </button>
                    {teacherDecision ? (
                      <p className="text-sm text-slate-600">
                        마지막 저장: {formatDateTime(teacherDecision.decidedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-500">
                학생 답변을 입력한 뒤 이해 분석 실행 버튼을 누르면 교사가 바로 읽을 수 있는
                근거 중심 결과가 표시됩니다.
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
