"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { AnalysisEvidenceReview } from "@/components/analysis-evidence-review";
import { AppHeader } from "@/components/app-header";
import { QuestionSetPreview } from "@/components/question-set-preview";
import { SessionTimeline } from "@/components/session-timeline";
import { StatusBadge } from "@/components/status-badge";
import { StudentAnswerReview } from "@/components/student-answer-review";
import { VerificationSessionBrowser } from "@/components/verification-session-browser";
import {
  EmptyState,
  Field,
  MetricCard,
  PageIntro,
  SurfaceCard,
} from "@/components/ui-blocks";
import { demoAnswerDraft, demoVerificationInput } from "@/lib/demo-data";
import {
  analysisClassificationMeta,
  buildStudentVerificationPath,
  buildStudentVerificationUrl,
  formatDateTime,
  teacherDecisionMeta,
} from "@/lib/presentation";
import type {
  AnalysisReport,
  AnalyzeUnderstandingResponse,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetResponse,
  GetVerificationResponse,
  QuestionSet,
  SaveTeacherDecisionResponse,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationActivity,
} from "@/lib/schemas";
import {
  type AnswerArtifacts,
  type AnswerDraft,
  answersFromStoredAnswers,
  artifactsFromStoredAnswers,
  buildSessionStatus,
  buildStudentAnswers,
  buildTeacherDraftPayload,
  buildVerificationInput,
  createTeacherDraftSnapshot,
  equalTeacherDraftPayload,
  hasTeacherDraftContent,
  initialAnswerArtifacts,
  initialAnswerState,
  initialDecisionState,
} from "@/lib/teacher-workbench";

type TeacherWorkbenchProps = {
  aiConfigured: boolean;
  managedDatabase: boolean;
};

const teacherDecisionOptions = Object.entries(teacherDecisionMeta) as Array<
  [
    TeacherDecision["decision"],
    (typeof teacherDecisionMeta)[TeacherDecision["decision"]],
  ]
>;

const teacherDraftStorageKey = "viva:teacher-workbench-draft";

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
  const [teacherDecision, setTeacherDecision] = useState<TeacherDecision | null>(
    null,
  );
  const [decisionDraft, setDecisionDraft] =
    useState<TeacherDecisionInput>(initialDecisionState);
  const [answers, setAnswers] = useState<AnswerDraft>(initialAnswerState);
  const [answerArtifacts, setAnswerArtifacts] =
    useState<AnswerArtifacts>(initialAnswerArtifacts);
  const [activity, setActivity] = useState<VerificationActivity[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [clientOrigin, setClientOrigin] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [persistedDraft, setPersistedDraft] = useState<ReturnType<
    typeof buildTeacherDraftPayload
  > | null>(null);
  const [activeAction, setActiveAction] = useState<
    "questions" | "analysis" | "decision" | "sync" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const deferredSubmissionText = useDeferredValue(submissionText);

  const teacherDraftPayload = useMemo(
    () =>
      buildTeacherDraftPayload({
        assignmentTitle,
        assignmentDescription,
        rubricConcepts,
        riskPoints,
        submissionText,
      }),
    [
      assignmentDescription,
      assignmentTitle,
      riskPoints,
      rubricConcepts,
      submissionText,
    ],
  );
  const verificationInput = useMemo(
    () => buildVerificationInput(teacherDraftPayload),
    [teacherDraftPayload],
  );
  const studentPath = verificationId
    ? buildStudentVerificationPath(verificationId)
    : null;
  const studentUrl =
    verificationId && clientOrigin
      ? buildStudentVerificationUrl(clientOrigin, verificationId)
      : "";
  const completionCount = Object.values(answers).filter(
    (value) => value.trim().length > 0,
  ).length;
  const studentAnswersForReview = questionSet
    ? buildStudentAnswers(questionSet, answers, answerArtifacts)
    : [];
  const sessionStatus = buildSessionStatus({
    teacherDecision,
    analysisReport,
    questionSet,
  });
  const hasUnsavedLocalChanges =
    draftReady && !equalTeacherDraftPayload(teacherDraftPayload, persistedDraft);

  useEffect(() => {
    setClientOrigin(window.location.origin);

    try {
      const rawDraft = window.localStorage.getItem(teacherDraftStorageKey);

      if (!rawDraft) {
        setDraftReady(true);
        return;
      }

      const parsedDraft = JSON.parse(rawDraft) as Partial<{
        assignmentTitle: string;
        assignmentDescription: string;
        rubricConcepts: string;
        riskPoints: string;
        submissionText: string;
        savedAt: string;
      }>;

      if (
        typeof parsedDraft.assignmentTitle === "string" &&
        typeof parsedDraft.assignmentDescription === "string" &&
        typeof parsedDraft.rubricConcepts === "string" &&
        typeof parsedDraft.riskPoints === "string" &&
        typeof parsedDraft.submissionText === "string"
      ) {
        const restoredDraft = buildTeacherDraftPayload({
          assignmentTitle: parsedDraft.assignmentTitle,
          assignmentDescription: parsedDraft.assignmentDescription,
          rubricConcepts: parsedDraft.rubricConcepts,
          riskPoints: parsedDraft.riskPoints,
          submissionText: parsedDraft.submissionText,
        });

        setAssignmentTitle(restoredDraft.assignmentTitle);
        setAssignmentDescription(restoredDraft.assignmentDescription);
        setRubricConcepts(restoredDraft.rubricConcepts);
        setRiskPoints(restoredDraft.riskPoints);
        setSubmissionText(restoredDraft.submissionText);
        setPersistedDraft(restoredDraft);
        setDraftSavedAt(
          typeof parsedDraft.savedAt === "string" ? parsedDraft.savedAt : null,
        );
        setNoticeMessage("저장된 초안을 복원했습니다.");
      }
    } catch {
      window.localStorage.removeItem(teacherDraftStorageKey);
      setNoticeMessage("저장된 초안을 읽지 못해 새 세션으로 시작합니다.");
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    if (!hasTeacherDraftContent(teacherDraftPayload)) {
      window.localStorage.removeItem(teacherDraftStorageKey);
      setPersistedDraft(null);
      setDraftSavedAt(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextSnapshot = createTeacherDraftSnapshot(teacherDraftPayload);
      window.localStorage.setItem(
        teacherDraftStorageKey,
        JSON.stringify(nextSnapshot),
      );
      setPersistedDraft(teacherDraftPayload);
      setDraftSavedAt(nextSnapshot.savedAt);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [
    assignmentDescription,
    assignmentTitle,
    draftReady,
    riskPoints,
    rubricConcepts,
    submissionText,
    teacherDraftPayload,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedLocalChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedLocalChanges]);

  const applyVerificationPayload = (payload: GetVerificationResponse) => {
    const verification = payload.verification;
    const nextDraft = buildTeacherDraftPayload({
      assignmentTitle: verification.assignmentTitle,
      assignmentDescription: verification.assignmentDescription,
      rubricConcepts: verification.rubricCoreConcepts.join("\n"),
      riskPoints: verification.rubricRiskPoints.join("\n"),
      submissionText: verification.submissionText,
    });

    setAssignmentTitle(nextDraft.assignmentTitle);
    setAssignmentDescription(nextDraft.assignmentDescription);
    setRubricConcepts(nextDraft.rubricConcepts);
    setRiskPoints(nextDraft.riskPoints);
    setSubmissionText(nextDraft.submissionText);
    setQuestionSet(verification.questionSet);
    setAnalysisReport(verification.analysisReport ?? null);
    setTeacherDecision(verification.teacherDecision ?? null);
    setAnswers(answersFromStoredAnswers(verification.studentAnswers));
    setAnswerArtifacts(artifactsFromStoredAnswers(verification.studentAnswers));
    setActivity(verification.activity);
    setPersistedDraft(nextDraft);
    setDraftSavedAt(verification.updatedAt);
    setDecisionDraft(
      verification.teacherDecision
        ? {
            decision: verification.teacherDecision.decision,
            notes: verification.teacherDecision.notes,
          }
        : {
            decision: "approved_understanding",
            notes: verification.analysisReport?.teacherSummary ?? "",
          },
    );
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
    setAnswerArtifacts(initialAnswerArtifacts);
    setActivity([]);
    setErrorMessage(null);
    setNoticeMessage(null);
  };

  const clearDraftAndReset = () => {
    window.localStorage.removeItem(teacherDraftStorageKey);
    setPersistedDraft(null);
    setDraftSavedAt(null);
    resetToDemo();
    setNoticeMessage("로컬 초안을 비우고 데모 입력으로 초기화했습니다.");
  };

  const generateQuestions = () => {
    setErrorMessage(null);
    setNoticeMessage(null);
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
          setAnswerArtifacts(initialAnswerArtifacts);
          setActivity([
            {
              type: "question_generated",
              recordedAt: payload.questionSet.generatedAt,
              message: "질문 세트를 생성하고 학생 응답 링크를 준비했습니다.",
            },
          ]);
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

  const syncLatestVerification = () => {
    if (!verificationId) {
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("sync");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/verifications/${verificationId}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "세션을 불러오지 못했습니다.");
          }

          const payload = (await response.json()) as GetVerificationResponse;
          applyVerificationPayload(payload);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "세션 동기화 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const runAnalysis = (
    nextAnswers: AnswerDraft,
    nextArtifacts: AnswerArtifacts,
  ) => {
    if (!questionSet || !verificationId) {
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("analysis");

    startTransition(() => {
      void (async () => {
        try {
          const requestBody: AnalyzeUnderstandingStoredRequest = {
            verificationId,
            ...verificationInput,
            questionSet,
            studentAnswers: buildStudentAnswers(
              questionSet,
              nextAnswers,
              nextArtifacts,
            ),
          };

          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "이해 분석에 실패했습니다.");
          }

          const payload = (await response.json()) as AnalyzeUnderstandingResponse;
          setAnalysisReport(payload.analysisReport);
          setTeacherDecision(null);
          setActivity((current) => [
            ...current,
            {
              type: "analysis_saved",
              recordedAt: payload.analysisReport.generatedAt,
              message: `학생 응답을 분석했습니다. 분류: ${
                analysisClassificationMeta[payload.analysisReport.classification]
                  .label
              }`,
            },
          ]);
          setDecisionDraft((current) => ({
            decision: current.decision,
            notes:
              current.notes.trim().length > 0
                ? current.notes
                : payload.analysisReport.teacherSummary,
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

  const fillDemoAnswersAndAnalyze = () => {
    const nextAnswers: AnswerDraft = {
      why: demoAnswerDraft.why,
      transfer: demoAnswerDraft.transfer,
      counterexample: demoAnswerDraft.counterexample,
    };

    setAnswers(nextAnswers);
    setAnswerArtifacts(initialAnswerArtifacts);
    runAnalysis(nextAnswers, initialAnswerArtifacts);
  };

  const saveTeacherDecision = () => {
    if (!verificationId) {
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("decision");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/teacher-decisions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verificationId, decision: decisionDraft }),
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "교사 판단 저장에 실패했습니다.");
          }

          const payload = (await response.json()) as SaveTeacherDecisionResponse;
          setTeacherDecision(payload.teacherDecision);
          setActivity((current) => [
            ...current,
            {
              type: "teacher_decision_saved",
              recordedAt: payload.teacherDecision.decidedAt,
              message: `교사 최종 판단을 저장했습니다. 결정: ${
                teacherDecisionMeta[payload.teacherDecision.decision].label
              }`,
            },
          ]);
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

  const copyStudentLink = async () => {
    if (!studentUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(studentUrl);
      setNoticeMessage("학생 링크를 복사했습니다.");
    } catch {
      setNoticeMessage("링크 복사에 실패했습니다. 직접 복사해 주세요.");
    }
  };

  const selectVerification = (nextVerificationId: string) => {
    if (
      hasUnsavedLocalChanges &&
      !window.confirm("현재 입력 중인 내용이 있습니다. 다른 세션으로 이동할까요?")
    ) {
      return;
    }

    setVerificationId(nextVerificationId);
    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("sync");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/verifications/${nextVerificationId}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "선택한 세션을 불러오지 못했습니다.");
          }

          const payload = (await response.json()) as GetVerificationResponse;
          applyVerificationPayload(payload);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "세션 불러오기 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  return (
    <main className="app-shell">
      <AppHeader
        current="teacher"
        utility={
          <div className="button-row">
            <Link
              href="/api/export?format=csv"
              className="button button--ghost button--compact"
            >
              CSV export
            </Link>
            <Link
              href="/operator"
              className="button button--ghost button--compact"
            >
              운영 요약
            </Link>
          </div>
        }
      />

      <div className="page-stack">
        <PageIntro
          eyebrow="Teacher Workbench"
          title="과제 기준을 정리하고 학생 이해를 검증합니다."
          description="교사는 과제와 루브릭을 정리하고 학생별 질문을 만든 뒤, 학생 답변과 분석 근거를 검토해 최종 판단을 내립니다."
          actions={
            <div className="button-row">
              <button
                type="button"
                onClick={resetToDemo}
                className="button button--ghost"
              >
                데모 입력 불러오기
              </button>
              <button
                type="button"
                onClick={clearDraftAndReset}
                className="button button--ghost"
              >
                초안 비우기
              </button>
              <button
                type="button"
                onClick={generateQuestions}
                disabled={isPending}
                className="button button--primary"
              >
                {activeAction === "questions" ? "질문 생성 중..." : "질문 생성"}
              </button>
            </div>
          }
          meta={
            <div className="badge-row">
              <StatusBadge tone={aiConfigured ? "success" : "warning"}>
                {aiConfigured ? "AI 연결 가능" : "Mock fallback"}
              </StatusBadge>
              <StatusBadge tone={managedDatabase ? "success" : "warning"}>
                {managedDatabase ? "Managed DB" : "Local store"}
              </StatusBadge>
              <StatusBadge tone="neutral">{sessionStatus}</StatusBadge>
              <StatusBadge tone={hasUnsavedLocalChanges ? "warning" : "info"}>
                {hasUnsavedLocalChanges ? "저장 대기" : "자동 저장"}
              </StatusBadge>
            </div>
          }
        />

        <div className="metric-grid">
          <MetricCard
            label="세션 상태"
            value={sessionStatus}
            note="질문 생성부터 교사 판단까지의 현재 단계"
          />
          <MetricCard
            label="질문 세트"
            value={questionSet ? "준비됨" : "미생성"}
            note="학생 응답 링크와 함께 공유"
          />
          <MetricCard
            label="응답 수집"
            value={`${completionCount}/3`}
            note="실제 답변 또는 데모 답변 기준"
          />
          <MetricCard
            label="초안 저장"
            value={draftSavedAt ? formatDateTime(draftSavedAt) : "없음"}
            note={
              hasUnsavedLocalChanges
                ? "로컬 변경사항이 저장 대기 중입니다."
                : "입력값을 브라우저에 자동 저장합니다."
            }
          />
        </div>

        {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}
        {noticeMessage ? <div className="inline-notice">{noticeMessage}</div> : null}

        <div className="teacher-layout">
          <div className="teacher-layout__main">
            <SurfaceCard
              eyebrow="1. Assignment Setup"
              title="과제와 루브릭을 정리합니다."
              description="질문과 분석은 아래 입력을 기준으로 동작합니다."
            >
              <div className="form-grid">
                <Field label="과제 제목">
                  <input
                    value={assignmentTitle}
                    onChange={(event) => setAssignmentTitle(event.target.value)}
                    className="form-input"
                  />
                </Field>
                <Field label="과제 설명">
                  <textarea
                    value={assignmentDescription}
                    onChange={(event) =>
                      setAssignmentDescription(event.target.value)
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </Field>
                <div className="split-grid">
                  <Field label="핵심 개념" helper="한 줄에 하나씩 입력합니다.">
                    <textarea
                      value={rubricConcepts}
                      onChange={(event) => setRubricConcepts(event.target.value)}
                      rows={7}
                      className="form-textarea"
                    />
                  </Field>
                  <Field
                    label="위험 신호"
                    helper="학생이 놓치거나 오해할 수 있는 지점을 적습니다."
                  >
                    <textarea
                      value={riskPoints}
                      onChange={(event) => setRiskPoints(event.target.value)}
                      rows={7}
                      className="form-textarea"
                    />
                  </Field>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard
              eyebrow="2. Submission"
              title="학생 제출물을 기준으로 읽습니다."
              description="질문은 제출물의 설명 구조와 개념 적용을 기준으로 만들어집니다."
            >
              <Field label="제출물 본문">
                <textarea
                  value={submissionText}
                  onChange={(event) => setSubmissionText(event.target.value)}
                  rows={14}
                  className="form-textarea"
                />
              </Field>
              <div className="preview-panel">
                <p className="preview-panel__label">현재 제출물 미리보기</p>
                <p className="preview-panel__body">{deferredSubmissionText}</p>
              </div>
            </SurfaceCard>
          </div>

          <div className="teacher-layout__side">
            <SurfaceCard
              eyebrow="3. Question Set"
              title="학생별 질문 3개를 생성합니다."
              description="왜형, 전이형, 반례형 질문으로 이해 구조를 확인합니다."
            >
              <QuestionSetPreview questionSet={questionSet} />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="4. Student Link"
              title="학생 응답 링크를 공유합니다."
              description="학생은 별도 화면에서 질문에 답하고, 교사는 이 화면에서 결과를 다시 불러옵니다."
            >
              {verificationId ? (
                <div className="stack-grid">
                  <div className="field-block">
                    <span className="field-block__label">학생용 링크</span>
                    <input
                      readOnly
                      value={studentUrl || studentPath || ""}
                      className="form-input form-input--mono"
                    />
                  </div>
                  <div className="button-row">
                    <button
                      type="button"
                      onClick={copyStudentLink}
                      className="button button--secondary"
                    >
                      링크 복사
                    </button>
                    <Link
                      href={studentPath ?? "#"}
                      target="_blank"
                      className="button button--ghost"
                    >
                      학생 화면 열기
                    </Link>
                    <button
                      type="button"
                      onClick={syncLatestVerification}
                      disabled={isPending}
                      className="button button--ghost"
                    >
                      {activeAction === "sync"
                        ? "동기화 중..."
                        : "최신 결과 불러오기"}
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="학생 링크는 질문 생성 후 활성화됩니다."
                  description="질문 세트를 먼저 생성해야 학생용 링크를 만들 수 있습니다."
                />
              )}
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Demo Run"
              title="데모 응답으로 바로 검증할 수 있습니다."
              description="실제 학생 답변이 없을 때도 제품 흐름을 빠르게 검증할 수 있습니다."
            >
              <div className="button-row">
                <button
                  type="button"
                  onClick={fillDemoAnswersAndAnalyze}
                  disabled={!questionSet || isPending}
                  className="button button--secondary"
                >
                  {activeAction === "analysis"
                    ? "데모 분석 중..."
                    : "샘플 답변으로 분석"}
                </button>
              </div>
            </SurfaceCard>
          </div>
        </div>

        <div className="review-layout">
          <div className="review-layout__main">
            <SurfaceCard
              eyebrow="5. Student Answers"
              title="학생 답변과 입력 메타를 먼저 확인합니다."
              description="실제 답변, 음성 전사 여부, 전사 후 수정 여부를 먼저 봅니다."
            >
              <StudentAnswerReview
                questionSet={questionSet}
                studentAnswers={studentAnswersForReview}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="6. Evidence Review"
              title="AI 분석 결과와 근거를 검토합니다."
              description="분류, 누락 개념, 충돌 지점, 재설명 포인트를 확인합니다."
              action={
                analysisReport ? (
                  <StatusBadge
                    tone={
                      analysisClassificationMeta[analysisReport.classification]
                        .tone
                    }
                  >
                    {
                      analysisClassificationMeta[analysisReport.classification]
                        .label
                    }
                  </StatusBadge>
                ) : undefined
              }
            >
              <AnalysisEvidenceReview analysisReport={analysisReport} />
            </SurfaceCard>
          </div>

          <div className="review-layout__side">
            <SurfaceCard
              eyebrow="7. Teacher Decision"
              title="교사 최종 판단을 저장합니다."
              description="AI 분석과 별도로 교사 판단을 남겨 최종 책임을 유지합니다."
            >
              <div className="decision-options">
                {teacherDecisionOptions.map(([decision, meta]) => (
                  <button
                    key={decision}
                    type="button"
                    data-active={decisionDraft.decision === decision}
                    onClick={() =>
                      setDecisionDraft((current) => ({ ...current, decision }))
                    }
                    className="option-button"
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
              <Field label="교사 메모" helper="최종 판단 근거를 명시적으로 남깁니다.">
                <textarea
                  value={decisionDraft.notes}
                  onChange={(event) =>
                    setDecisionDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={5}
                  className="form-textarea"
                />
              </Field>
              <div className="button-row">
                <button
                  type="button"
                  onClick={saveTeacherDecision}
                  disabled={isPending || !verificationId || !analysisReport}
                  className="button button--primary"
                >
                  {activeAction === "decision"
                    ? "판단 저장 중..."
                    : "교사 판단 저장"}
                </button>
              </div>
              {teacherDecision ? (
                <div className="summary-box">
                  <div className="badge-row">
                    <StatusBadge
                      tone={teacherDecisionMeta[teacherDecision.decision].tone}
                    >
                      {teacherDecisionMeta[teacherDecision.decision].label}
                    </StatusBadge>
                    <StatusBadge tone="neutral">
                      {formatDateTime(teacherDecision.decidedAt)}
                    </StatusBadge>
                  </div>
                  <p className="summary-box__body">{teacherDecision.notes}</p>
                </div>
              ) : (
                <p className="helper-text">
                  아직 저장된 교사 최종 판단이 없습니다.
                </p>
              )}
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Session Record"
              title="세션 기록"
              description="질문 생성, 분석, 교사 판단 저장 흐름을 확인합니다."
            >
              <SessionTimeline
                verificationId={verificationId}
                activity={activity}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Session Browser"
              title="최근 세션 다시 불러오기"
              description="과제명, verificationId, 상태 기준으로 이전 검증 기록을 다시 엽니다."
            >
              <VerificationSessionBrowser
                activeVerificationId={verificationId}
                onSelectVerification={selectVerification}
              />
            </SurfaceCard>
          </div>
        </div>
      </div>
    </main>
  );
}
