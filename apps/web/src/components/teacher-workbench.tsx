"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";

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
  managedDatabase: boolean;
};

const classificationMeta: Record<
  AnalysisReport["classification"],
  { label: string; tone: "success" | "warning" | "danger" | "info"; note: string }
> = {
  sufficient_understanding: {
    label: "이해 충분",
    tone: "success",
    note: "핵심 개념과 전이 설명이 전반적으로 일관됩니다.",
  },
  surface_memorization: {
    label: "표면 암기",
    tone: "warning",
    note: "용어는 맞지만 구조적 이해의 증거가 약합니다.",
  },
  submission_dependency: {
    label: "제출물 의존",
    tone: "warning",
    note: "제출물 표현에 기대고 있어 독립적 설명이 부족합니다.",
  },
  core_misconception: {
    label: "핵심 오개념",
    tone: "danger",
    note: "루브릭의 핵심 개념을 잘못 이해했을 가능성이 높습니다.",
  },
  uncertain: {
    label: "불확실",
    tone: "info",
    note: "추가 질문이나 교사 판단이 더 필요합니다.",
  },
};

const teacherDecisionMeta: Record<
  TeacherDecision["decision"],
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  approved_understanding: { label: "이해 승인", tone: "success" },
  needs_followup: { label: "후속 확인 필요", tone: "warning" },
  manual_review_required: { label: "수동 검토 필요", tone: "danger" },
};

const teacherDecisionOptions = Object.entries(teacherDecisionMeta) as Array<
  [TeacherDecision["decision"], (typeof teacherDecisionMeta)[TeacherDecision["decision"]]]
>;

const initialAnswerState: Record<QuestionType, string> = {
  why: "",
  transfer: "",
  counterexample: "",
};

const initialDecisionState: TeacherDecisionInput = {
  decision: "approved_understanding",
  notes: "",
};

const parseMultilineInput = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

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

function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="viva-panel rounded-[1.85rem] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="viva-caption">{eyebrow}</p>
          <h2 className="mt-2 text-[1.7rem] font-semibold leading-tight text-[var(--foreground)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgba(24,20,17,0.68)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ListBlock({
  eyebrow,
  items,
  emptyText,
}: {
  eyebrow: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="viva-grid-rule rounded-[1.45rem] px-4 py-4">
      <p className="viva-caption">{eyebrow}</p>
      <ul className="mt-4 grid gap-2 text-sm leading-7 text-[rgba(24,20,17,0.74)]">
        {items.length > 0 ? items.map((item) => <li key={item}>• {item}</li>) : <li>• {emptyText}</li>}
      </ul>
    </div>
  );
}

export function TeacherWorkbench({
  aiConfigured,
  managedDatabase,
}: TeacherWorkbenchProps) {
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
  const [teacherDecision, setTeacherDecision] = useState<TeacherDecision | null>(null);
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

  const loadDemoAnswers = () => {
    setAnswers({
      why: demoAnswerDraft.why,
      transfer: demoAnswerDraft.transfer,
      counterexample: demoAnswerDraft.counterexample,
    });
  };

  const generateQuestions = () => {
    setErrorMessage(null);
    setActiveAction("questions");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
            error instanceof Error ? error.message : "질문 생성 중 오류가 발생했습니다.",
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
            headers: { "Content-Type": "application/json" },
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
            error instanceof Error ? error.message : "이해 분석 중 오류가 발생했습니다.",
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
            headers: { "Content-Type": "application/json" },
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
            error instanceof Error ? error.message : "교사 판단 저장 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  return (
    <main className="viva-page py-4 sm:py-6">
      <section className="viva-panel viva-reveal-1 rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="viva-kicker">teacher hearing console</span>
              <StatusBadge tone={aiConfigured ? "success" : "warning"}>
                {aiConfigured ? "실제 AI 연결 가능" : "Mock fallback"}
              </StatusBadge>
              <StatusBadge tone={managedDatabase ? "success" : "warning"}>
                {managedDatabase ? "Managed DB" : "Local store"}
              </StatusBadge>
            </div>
            <p className="viva-caption">Verification Workbench</p>
            <h1 className="viva-display max-w-4xl text-[2.8rem] text-[var(--foreground)] sm:text-[4rem]">
              교사는 순서를 따라가고,
              <br />
              <span className="text-[var(--accent)]">VIVA는 근거</span>를 만듭니다.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-[rgba(24,20,17,0.72)]">
              과제와 루브릭을 넣고 질문 생성과 분석을 실행하면 됩니다. 자동 채점이
              아니라 검증 워크플로우를 구성하는 것이 이 화면의 목적입니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={resetToDemo} className="viva-button-ghost">
                데모 입력값 불러오기
              </button>
              <Link href="/operator" className="viva-button-secondary">
                운영자 요약 보기
              </Link>
              <Link href="/api/export?format=csv" className="viva-button-ghost">
                CSV export
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="viva-grid-rule rounded-[1.8rem] px-5 py-5">
              <p className="viva-caption">Current Session</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  ["세션 상태", verificationId ? "생성됨" : "대기 중"],
                  ["분석 상태", analysisReport ? "완료" : "미실행"],
                  ["교사 판단", teacherDecision ? "저장됨" : "미저장"],
                ].map(([label, value]) => (
                  <div key={label} className="viva-stat rounded-[1.45rem] px-4 py-4">
                    <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-[rgba(24,20,17,0.52)]">
                      {label}
                    </p>
                    <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              {verificationId ? (
                <p className="mt-4 text-xs leading-6 text-[rgba(24,20,17,0.54)]">
                  verification id: {verificationId}
                </p>
              ) : null}
            </div>
            <div className="viva-panel-soft rounded-[1.8rem] px-5 py-5">
              <p className="viva-caption">Action Order</p>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-[rgba(24,20,17,0.72)]">
                {["과제와 루브릭 입력", "질문 3개 생성", "학생 답변 입력", "이해 분석 실행", "교사 판단 저장"].map((item, index) => (
                  <div key={item} className="grid grid-cols-[2rem_1fr] gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(125,46,42,0.18)] bg-[rgba(125,46,42,0.08)] text-xs font-extrabold text-[var(--accent)]">
                      {index + 1}
                    </div>
                    <p className="pt-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="viva-panel rounded-[1.6rem] border-[rgba(127,32,37,0.2)] bg-[rgba(127,32,37,0.06)] px-5 py-4 text-sm leading-7 text-[rgba(127,32,37,0.96)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="grid gap-4">
          <SectionCard
            eyebrow="Assignment Setup"
            title="과제와 루브릭 입력"
            description="질문 생성과 분석의 기준이 되는 입력입니다."
            action={<StatusBadge tone="neutral">교사 입력</StatusBadge>}
          >
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">과제 제목</span>
                <input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} className="viva-field" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">과제 설명</span>
                <textarea value={assignmentDescription} onChange={(event) => setAssignmentDescription(event.target.value)} rows={5} className="viva-textarea" />
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">핵심 개념</span>
                  <textarea value={rubricConcepts} onChange={(event) => setRubricConcepts(event.target.value)} rows={7} className="viva-textarea" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">취약 포인트</span>
                  <textarea value={riskPoints} onChange={(event) => setRiskPoints(event.target.value)} rows={7} className="viva-textarea" />
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Submission Review"
            title="학생 제출물"
            description="질문은 이 제출물의 표현과 논리 구조를 기준으로 생성됩니다."
            action={<StatusBadge tone="accent">제출 기반</StatusBadge>}
          >
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">제출물 본문</span>
              <textarea value={submissionText} onChange={(event) => setSubmissionText(event.target.value)} rows={13} className="viva-textarea" />
            </label>
            <div className="viva-grid-rule mt-4 rounded-[1.45rem] px-4 py-4">
              <p className="viva-caption">Preview Focus</p>
              <p className="mt-4 text-sm leading-8 text-[rgba(24,20,17,0.74)]">{deferredSubmissionText}</p>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4">
          <SectionCard
            eyebrow="Question Generation"
            title="제출물 기반 질문 3개"
            description="왜형, 전이형, 반례형 세 축을 분리해 검증합니다."
            action={
              <button type="button" onClick={generateQuestions} disabled={isPending} className="viva-button-primary">
                {activeAction === "questions" ? "질문 생성 중..." : "질문 생성"}
              </button>
            }
          >
            {questionSet ? (
              <div className="grid gap-4">
                <div className="viva-panel-soft rounded-[1.45rem] px-4 py-4">
                  <p className="viva-caption">Overall Strategy</p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(24,20,17,0.74)]">{questionSet.overallStrategy}</p>
                </div>
                {questionSet.questions.map((question) => (
                  <article key={question.type} className="viva-grid-rule rounded-[1.45rem] px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{formatQuestionType(question.type)} 질문</h3>
                      <StatusBadge tone="neutral">{question.type}</StatusBadge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[rgba(24,20,17,0.82)]">{question.question}</p>
                    <p className="mt-4 text-sm leading-7 text-[rgba(24,20,17,0.58)]">의도: {question.intent}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                질문 생성 버튼을 누르면 왜형·전이형·반례형 질문이 표시됩니다.
              </div>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Student Response"
            title="학생 답변 입력"
            description="짧고 독립적인 설명으로 실제 이해를 확인합니다."
            action={
              <button type="button" onClick={loadDemoAnswers} disabled={!questionSet} className="viva-button-ghost">
                데모 답변 채우기
              </button>
            }
          >
            {questionSet ? (
              <div className="grid gap-4">
                {questionSet.questions.map((question) => (
                  <label key={question.type} className="grid gap-2">
                    <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">{formatQuestionType(question.type)} 답변</span>
                    <textarea
                      value={answers[question.type]}
                      onChange={(event) => setAnswers((current) => ({ ...current, [question.type]: event.target.value }))}
                      rows={4}
                      className="viva-textarea"
                    />
                  </label>
                ))}
                <button type="button" onClick={runAnalysis} disabled={!questionSet || isPending} className="viva-button-secondary">
                  {activeAction === "analysis" ? "이해 분석 중..." : "이해 분석 실행"}
                </button>
              </div>
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                질문이 생성되면 답변 입력 영역이 열립니다.
              </div>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Evidence Review"
            title="교사 판단 근거"
            description="AI 결과는 설명 가능한 근거로 구조화됩니다."
            action={
              <StatusBadge tone={analysisReport ? classificationMeta[analysisReport.classification].tone : "neutral"}>
                {analysisReport ? classificationMeta[analysisReport.classification].label : "분석 전"}
              </StatusBadge>
            }
          >
            {analysisReport ? (
              <div className="grid gap-4">
                <div className="viva-panel-soft rounded-[1.45rem] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone={classificationMeta[analysisReport.classification].tone}>
                      {classificationMeta[analysisReport.classification].label}
                    </StatusBadge>
                    <StatusBadge tone="neutral">신뢰도 {analysisReport.confidenceBand}</StatusBadge>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[rgba(24,20,17,0.82)]">{analysisReport.teacherSummary}</p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(24,20,17,0.58)]">{classificationMeta[analysisReport.classification].note}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <ListBlock eyebrow="Missing Concepts" items={analysisReport.conceptCoverage.missingConcepts} emptyText="빠진 개념이 두드러지지 않습니다." />
                  <ListBlock eyebrow="Reteaching Points" items={analysisReport.reteachingPoints} emptyText="재설명 포인트가 없습니다." />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <ListBlock eyebrow="Alignment Evidence" items={analysisReport.semanticAlignment.evidence} emptyText="정렬 근거가 없습니다." />
                  <ListBlock eyebrow="Risk Flags" items={analysisReport.riskFlags} emptyText="추가 위험 신호가 감지되지 않았습니다." />
                </div>

                <div className="viva-grid-rule rounded-[1.45rem] px-4 py-4">
                  <p className="viva-caption">Contradictions</p>
                  {analysisReport.contradictionCheck.contradictions.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {analysisReport.contradictionCheck.contradictions.map((item, index) => (
                        <div key={`${item.submissionClaim}-${index}`} className="viva-stat rounded-[1.2rem] px-4 py-4 text-sm leading-7 text-[rgba(24,20,17,0.78)]">
                          <p>제출물 주장: {item.submissionClaim}</p>
                          <p className="mt-1">답변 주장: {item.answerClaim}</p>
                          <p className="mt-3 text-[rgba(24,20,17,0.58)]">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-[rgba(24,20,17,0.62)]">현재 두드러지는 충돌 문장은 없습니다.</p>
                  )}
                </div>

                <div className="viva-panel rounded-[1.45rem] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="viva-caption">Teacher Override</p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">교사 최종 판단</h3>
                    </div>
                    <StatusBadge tone={teacherDecision ? "success" : "warning"}>
                      {teacherDecision ? teacherDecisionMeta[teacherDecision.decision].label : "미저장"}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {teacherDecisionOptions.map(([decision, meta]) => (
                      <button
                        key={decision}
                        type="button"
                        data-active={decisionDraft.decision === decision}
                        onClick={() => setDecisionDraft((current) => ({ ...current, decision }))}
                        className="viva-pill-select"
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>
                  <label className="mt-4 grid gap-2">
                    <span className="text-sm font-semibold text-[rgba(24,20,17,0.74)]">교사 판단 메모</span>
                    <textarea value={decisionDraft.notes} onChange={(event) => setDecisionDraft((current) => ({ ...current, notes: event.target.value }))} rows={4} className="viva-textarea" />
                  </label>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={saveTeacherDecision}
                      disabled={isPending || !verificationId || decisionDraft.notes.trim().length === 0}
                      className="viva-button-primary"
                    >
                      {activeAction === "decision" ? "교사 판단 저장 중..." : "교사 판단 저장"}
                    </button>
                    {teacherDecision ? (
                      <p className="text-sm text-[rgba(24,20,17,0.56)]">마지막 저장: {formatDateTime(teacherDecision.decidedAt)}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                학생 답변을 입력한 뒤 이해 분석 실행 버튼을 누르면 교사가 바로 읽을 수 있는 근거 중심 결과가 표시됩니다.
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
