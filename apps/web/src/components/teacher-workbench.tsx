"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AnalysisEvidenceReview } from "@/components/analysis-evidence-review";
import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
import { CoachTour } from "@/components/coach-tour";
import { QuestionSetPreview } from "@/components/question-set-preview";
import { SessionTimeline } from "@/components/session-timeline";
import { StatusBadge } from "@/components/status-badge";
import { StudentAnswerReview } from "@/components/student-answer-review";
import { TeacherFlowGuide } from "@/components/teacher-flow-guide";
import { TeacherSessionControls } from "@/components/teacher-session-controls";
import { TeacherSessionPolicyCard } from "@/components/teacher-session-policy-card";
import { TeacherStudentLinkCard } from "@/components/teacher-student-link-card";
import { VerificationSessionBrowser } from "@/components/verification-session-browser";
import {
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
  AnalyzeUnderstandingStoredRequest,
  QuestionSet,
  StudentAccessState,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationActivity,
  VerificationSessionPreferences,
} from "@/lib/schemas";
import {
  analyzeTeacherVerification,
  fetchTeacherVerification,
  generateTeacherQuestionSet,
  saveTeacherDecisionRequest,
  updateTeacherStudentAccess,
} from "@/lib/teacher-workbench-api";
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
import {
  buildSessionPreferencesFromWorkspaceSettings,
  createDefaultWorkspaceSettingsSnapshot,
  readWorkspaceSettings,
} from "@/lib/workspace-settings";
import type { VivaRole } from "@/lib/auth";

type TeacherWorkbenchProps = {
  aiConfigured: boolean;
  managedDatabase: boolean;
  role: VivaRole | null;
};

type ActiveAction =
  | "questions"
  | "analysis"
  | "decision"
  | "sync"
  | "access"
  | null;

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
  role,
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
  const [studentAccessState, setStudentAccessState] =
    useState<StudentAccessState>("open");
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
  const [sessionPreferences, setSessionPreferences] =
    useState<VerificationSessionPreferences>(
      buildSessionPreferencesFromWorkspaceSettings(
        createDefaultWorkspaceSettingsSnapshot(),
      ),
    );
  const [workspaceSettingsSavedAt, setWorkspaceSettingsSavedAt] = useState<
    string | null
  >(null);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [isPending, startTransition] = useTransition();

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
  const questionRequest = useMemo(
    () => ({
      ...verificationInput,
      sessionPreferences,
    }),
    [sessionPreferences, verificationInput],
  );
  const studentPath = verificationId
    ? buildStudentVerificationPath(verificationId)
    : null;
  const studentUrl =
    verificationId && clientOrigin
      ? buildStudentVerificationUrl(clientOrigin, verificationId)
      : "";
  const currentExportFormat = sessionPreferences.preferredExportFormat;
  const currentExportHref = verificationId
    ? `/api/export?format=${currentExportFormat}&verificationId=${verificationId}`
    : `/api/export?format=${currentExportFormat}`;
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
  const canGenerateQuestions =
    verificationInput.assignmentTitle.trim().length > 0 &&
    verificationInput.assignmentDescription.trim().length > 0 &&
    verificationInput.rubricCoreConcepts.length > 0 &&
    verificationInput.submissionText.trim().length > 0;
  const canAnalyze = Boolean(questionSet && verificationId && completionCount === 3);
  const canSaveTeacherDecision = Boolean(verificationId && analysisReport);
  const accessOpen = studentAccessState === "open";

  useEffect(() => {
    setClientOrigin(window.location.origin);

    const applyWorkspaceSettings = () => {
      const workspaceSettings = readWorkspaceSettings();
      setSessionPreferences(
        buildSessionPreferencesFromWorkspaceSettings(workspaceSettings),
      );
      setWorkspaceSettingsSavedAt(workspaceSettings.savedAt);
    };

    applyWorkspaceSettings();
    window.addEventListener("focus", applyWorkspaceSettings);

    try {
      const rawDraft = window.sessionStorage.getItem(teacherDraftStorageKey);

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
      window.sessionStorage.removeItem(teacherDraftStorageKey);
      setNoticeMessage("저장된 초안을 읽지 못해 새 세션으로 시작합니다.");
    } finally {
      setDraftReady(true);
    }

    return () => {
      window.removeEventListener("focus", applyWorkspaceSettings);
    };
  }, []);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    if (!hasTeacherDraftContent(teacherDraftPayload)) {
      window.sessionStorage.removeItem(teacherDraftStorageKey);
      setPersistedDraft(null);
      setDraftSavedAt(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextSnapshot = createTeacherDraftSnapshot(teacherDraftPayload);
      window.sessionStorage.setItem(
        teacherDraftStorageKey,
        JSON.stringify(nextSnapshot),
      );
      setPersistedDraft(teacherDraftPayload);
      setDraftSavedAt(nextSnapshot.savedAt);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [draftReady, teacherDraftPayload]);

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

  const applyVerificationPayload = (
    payload: Awaited<ReturnType<typeof fetchTeacherVerification>>,
  ) => {
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
    setStudentAccessState(verification.studentAccessState);
    setSessionPreferences(verification.sessionPreferences);
    setAnalysisReport(verification.analysisReport ?? null);
    setTeacherDecision(verification.teacherDecision ?? null);
    setAnswers(answersFromStoredAnswers(verification.studentAnswers));
    setAnswerArtifacts(artifactsFromStoredAnswers(verification.studentAnswers));
    setActivity(verification.activity);
    setVerificationId(verification.verificationId);
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

  const fetchVerification = async (
    targetVerificationId: string,
    successMessage?: string,
  ) => {
    const payload = await fetchTeacherVerification(targetVerificationId);

    applyVerificationPayload(payload);
    setErrorMessage(null);

    if (successMessage) {
      setNoticeMessage(successMessage);
    }
  };

  const resetToDemo = () => {
    const workspaceSettings = readWorkspaceSettings();
    setAssignmentTitle(demoVerificationInput.assignmentTitle);
    setAssignmentDescription(demoVerificationInput.assignmentDescription);
    setRubricConcepts(demoVerificationInput.rubricCoreConcepts.join("\n"));
    setRiskPoints(demoVerificationInput.rubricRiskPoints.join("\n"));
    setSubmissionText(demoVerificationInput.submissionText);
    setQuestionSet(null);
    setStudentAccessState("open");
    setSessionPreferences(
      buildSessionPreferencesFromWorkspaceSettings(workspaceSettings),
    );
    setWorkspaceSettingsSavedAt(workspaceSettings.savedAt);
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
    window.sessionStorage.removeItem(teacherDraftStorageKey);
    setPersistedDraft(null);
    setDraftSavedAt(null);
    resetToDemo();
    setNoticeMessage("로컬 초안을 비우고 데모 입력으로 초기화했습니다.");
  };

  const fillDemoAnswers = () => {
    setAnswers({
      why: demoAnswerDraft.why,
      transfer: demoAnswerDraft.transfer,
      counterexample: demoAnswerDraft.counterexample,
    });
    setAnswerArtifacts(initialAnswerArtifacts);
    setNoticeMessage("데모 답변을 채웠습니다. 바로 분석을 실행할 수 있습니다.");
  };

  const handleGenerateQuestions = () => {
    if (!canGenerateQuestions) {
      setErrorMessage("과제명, 과제 설명, 핵심 개념, 제출물을 먼저 채워 주세요.");
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("questions");

    startTransition(() => {
      void (async () => {
        try {
          const payload = await generateTeacherQuestionSet(questionRequest);

          setQuestionSet(payload.questionSet);
          setVerificationId(payload.verificationId);
          setAnalysisReport(null);
          setTeacherDecision(null);
          setDecisionDraft(initialDecisionState);
          setAnswers(initialAnswerState);
          setAnswerArtifacts(initialAnswerArtifacts);
          await fetchVerification(
            payload.verificationId,
            "질문 세트를 생성했습니다. 이제 학생 링크를 공유하세요.",
          );
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

  const handleSyncLatestVerification = () => {
    if (!verificationId) {
      setErrorMessage("먼저 질문 세트를 생성하거나 기존 세션을 선택해 주세요.");
      return;
    }

    setErrorMessage(null);
    setActiveAction("sync");

    startTransition(() => {
      void (async () => {
        try {
          await fetchVerification(
            verificationId,
            "최신 세션 상태를 다시 불러왔습니다.",
          );
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "최신 세션을 불러오지 못했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const handleSelectVerification = (targetVerificationId: string) => {
    setErrorMessage(null);
    setActiveAction("sync");

    startTransition(() => {
      void (async () => {
        try {
          await fetchVerification(
            targetVerificationId,
            "선택한 세션을 불러왔습니다.",
          );
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "세션을 불러오지 못했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const handleAnalyze = () => {
    if (!questionSet || !verificationId) {
      setErrorMessage("먼저 질문 세트를 생성해 주세요.");
      return;
    }

    if (completionCount !== 3) {
      setErrorMessage("학생 답변 3개가 모두 있어야 분석을 실행할 수 있습니다.");
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("analysis");

    startTransition(() => {
      void (async () => {
        try {
          const payload: AnalyzeUnderstandingStoredRequest = {
            verificationId,
            assignmentTitle: verificationInput.assignmentTitle,
            assignmentDescription: verificationInput.assignmentDescription,
            rubricCoreConcepts: verificationInput.rubricCoreConcepts,
            rubricRiskPoints: verificationInput.rubricRiskPoints,
            submissionText: verificationInput.submissionText,
            questionSet,
            sessionPreferences,
            studentAnswers: buildStudentAnswers(
              questionSet,
              answers,
              answerArtifacts,
            ),
          };
          await analyzeTeacherVerification(payload);

          await fetchVerification(
            verificationId,
            "학생 답변을 분석했습니다. 근거를 검토하고 최종 판단을 저장하세요.",
          );
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "분석 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const handleSaveTeacherDecision = () => {
    if (!verificationId || !analysisReport) {
      setErrorMessage("분석이 끝난 세션에서만 교사 판단을 저장할 수 있습니다.");
      return;
    }

    if (decisionDraft.notes.trim().length === 0) {
      setErrorMessage("교사 판단 메모를 입력해 주세요.");
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setActiveAction("decision");

    startTransition(() => {
      void (async () => {
        try {
          const payload = await saveTeacherDecisionRequest(
            verificationId,
            decisionDraft,
          );

          setTeacherDecision(payload.teacherDecision);
          await fetchVerification(
            verificationId,
            "교사 최종 판단을 저장했습니다.",
          );
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

  const handleToggleStudentAccess = () => {
    if (!verificationId) {
      setErrorMessage("먼저 질문 세트를 생성해 주세요.");
      return;
    }

    setErrorMessage(null);
    setActiveAction("access");

    startTransition(() => {
      void (async () => {
        try {
          await updateTeacherStudentAccess(
            verificationId,
            accessOpen ? "locked" : "open",
          );

          await fetchVerification(
            verificationId,
            accessOpen
              ? "학생 링크를 잠갔습니다."
              : "학생 링크를 다시 열었습니다.",
          );
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "학생 링크 상태 변경 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const handleCopyStudentLink = async () => {
    if (!studentUrl) {
      setErrorMessage("복사할 학생 링크가 아직 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(studentUrl);
      setNoticeMessage("학생 링크를 클립보드에 복사했습니다.");
    } catch {
      setErrorMessage("클립보드에 링크를 복사하지 못했습니다.");
    }
  };

  const flowSteps = [
    {
      key: "setup",
      title: "과제 기준 입력",
      description: "과제 설명, 루브릭 핵심 개념, 제출물을 입력합니다.",
      status: questionSet ? "complete" : "current",
      note: draftSavedAt
        ? `초안 임시 저장: ${formatDateTime(draftSavedAt)}`
        : "입력 초안은 현재 탭에 임시 저장됩니다.",
    },
    {
      key: "questions",
      title: "질문 세트 생성",
      description: "왜형, 전이형, 반례형 질문을 학생별로 생성합니다.",
      status: questionSet ? "complete" : "pending",
      note: questionSet
        ? `${questionSet.modelVersion} · ${formatDateTime(questionSet.generatedAt)}`
        : "세션 생성 후 학생 링크가 열립니다.",
    },
    {
      key: "student",
      title: "학생 답변 수집",
      description: "학생은 링크에서 텍스트 또는 음성으로 답변합니다.",
      status:
        questionSet && completionCount < 3 && !analysisReport
          ? "current"
          : completionCount === 3 || analysisReport
            ? "complete"
            : "pending",
      note:
        questionSet && completionCount < 3
          ? `현재 ${completionCount}/3 문항 작성`
          : completionCount === 3
            ? "분석을 실행할 준비가 됐습니다."
            : "질문 생성 후 학생 링크를 공유하세요.",
    },
    {
      key: "analysis",
      title: "분석 근거 검토",
      description: "누락 개념, 충돌 문장, 위험 신호를 검토합니다.",
      status:
        analysisReport && !teacherDecision
          ? "current"
          : analysisReport
            ? "complete"
            : "pending",
      note: analysisReport
        ? `${analysisClassificationMeta[analysisReport.classification].label} · 확신도 ${analysisReport.confidenceBand}`
        : "학생 답변 3개가 채워지면 분석할 수 있습니다.",
    },
    {
      key: "decision",
      title: "교사 최종 판단",
      description: "AI 근거를 보고 교사가 최종 판단과 메모를 남깁니다.",
      status: teacherDecision ? "complete" : analysisReport ? "current" : "pending",
      note: teacherDecision
        ? `${teacherDecisionMeta[teacherDecision.decision].label} · ${formatDateTime(teacherDecision.decidedAt)}`
        : "분석 후 교사 판단을 저장하세요.",
    },
  ] as const;

  return (
    <main className="app-shell app-shell--teacher">
      <AppHeader
        current="teacher"
        utility={role ? <AuthUtility role={role} /> : undefined}
      />

      <div className="page-stack page-stack--teacher">
        <div data-tour="teacher-intro">
          <PageIntro
            variant="tool"
            eyebrow="교사 워크벤치"
            title="질문 생성부터 최종 판단까지 한 번에 처리합니다"
            description="입력, 링크 공유, 분석 확인, 최종 판단을 한 화면에서 끝냅니다."
            actions={
              <div className="button-row">
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isPending || !canGenerateQuestions}
                  className="button button--primary"
                >
                  {activeAction === "questions" ? "질문 생성 중..." : "질문 생성"}
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isPending || !canAnalyze}
                  className="button button--secondary"
                >
                  {activeAction === "analysis" ? "분석 중..." : "분석 실행"}
                </button>
                {verificationId ? (
                  <Link
                    href={`/teacher/verifications/${verificationId}`}
                    className="button button--ghost"
                  >
                    세션 상세
                  </Link>
                ) : null}
              </div>
            }
            meta={
              <div className="badge-row">
                <StatusBadge tone={aiConfigured ? "success" : "warning"}>
                  {aiConfigured ? "AI 연결됨" : "AI 키 없음"}
                </StatusBadge>
                <StatusBadge tone={managedDatabase ? "success" : "warning"}>
                  {managedDatabase ? "관리형 DB" : "로컬 저장소"}
                </StatusBadge>
                <StatusBadge tone="neutral">{sessionStatus}</StatusBadge>
                {draftSavedAt ? (
                  <StatusBadge tone={hasUnsavedLocalChanges ? "warning" : "neutral"}>
                    {hasUnsavedLocalChanges
                      ? "저장 대기"
                      : `임시 저장 ${formatDateTime(draftSavedAt)}`}
                  </StatusBadge>
                ) : null}
              </div>
            }
          />
        </div>

        {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}
        {noticeMessage ? <div className="inline-notice">{noticeMessage}</div> : null}

        <CoachTour
          storageKey="viva:onboarding:teacher"
          tone="teacher"
          steps={[
            {
              selector: '[data-tour="teacher-intro"]',
              title: "먼저 현재 세션 상태를 봅니다",
              description: "질문 생성, 분석, 세션 상세 이동은 여기서 시작합니다.",
              placement: "bottom",
            },
            {
              selector: '[data-tour="teacher-prep"]',
              title: "과제 기준을 먼저 정리합니다",
              description: "과제 설명, 핵심 개념, 위험 신호, 제출물을 먼저 맞춰야 질문 품질이 안정됩니다.",
              placement: "right",
            },
            {
              selector: '[data-tour="teacher-student-link"]',
              title: "질문 생성 후 학생 링크를 공유합니다",
              description: "학생은 이 링크로만 들어와 답합니다. 여기서 복사, 잠금, 동기화를 처리합니다.",
              placement: "left",
            },
            {
              selector: '[data-tour="teacher-analysis"]',
              title: "답변이 들어오면 근거를 먼저 봅니다",
              description: "누락 개념, 논리 충돌, 재설명 포인트를 먼저 읽고 판단을 준비합니다.",
              placement: "left",
            },
            {
              selector: '[data-tour="teacher-decision"]',
              title: "마지막으로 교사 판단을 저장합니다",
              description: "AI 분류를 그대로 통과시키지 않고 교사 메모와 함께 최종 결정을 남깁니다.",
              placement: "left",
            },
          ]}
        />

        <TeacherFlowGuide
          steps={flowSteps.map((step) => ({
            ...step,
            status: step.status as "complete" | "current" | "pending",
          }))}
        />

        <div className="metric-grid">
          <MetricCard
            label="현재 세션 상태"
            value={sessionStatus}
            note={verificationId ? verificationId : "세션이 아직 생성되지 않았습니다."}
          />
          <MetricCard
            label="학생 답변 작성 수"
            value={`${completionCount} / 3`}
            note="세 문항이 모두 채워져야 분석을 실행할 수 있습니다."
          />
          <MetricCard
            label="질문 모델"
            value={questionSet?.modelVersion ?? "없음"}
            note="질문 생성 후 세션 상세에서 다시 확인할 수 있습니다."
          />
          <MetricCard
            label="분석 모델"
            value={analysisReport?.modelVersion ?? "없음"}
            note="실제 AI가 막히면 대체 경로 사용 여부가 결과에 남습니다."
          />
        </div>

        <div className="teacher-layout">
          <div className="teacher-layout__main">
            <div data-tour="teacher-prep">
              <SurfaceCard
                eyebrow="1. 세션 준비"
                title="과제 기준과 제출물을 먼저 정리합니다"
                description="교사 기준이 정확해야 이후 질문과 분석도 일관됩니다."
                action={
                  <div className="button-row">
                    <button
                      type="button"
                      onClick={resetToDemo}
                      className="button button--ghost button--compact"
                    >
                      데모 입력 복원
                    </button>
                    <button
                      type="button"
                      onClick={clearDraftAndReset}
                      className="button button--ghost button--compact"
                    >
                      초안 비우기
                    </button>
                  </div>
                }
              >
                <div className="stack-grid">
                <Field label="과제명">
                  <input
                    value={assignmentTitle}
                    onChange={(event) => setAssignmentTitle(event.target.value)}
                    className="form-input"
                    placeholder="예: 중력가속도 실험 보고서"
                  />
                </Field>
                <Field label="과제 설명">
                  <textarea
                    value={assignmentDescription}
                    onChange={(event) =>
                      setAssignmentDescription(event.target.value)
                    }
                    rows={4}
                    className="form-textarea"
                    placeholder="학생이 무엇을 설명해야 하는지 정리해 주세요."
                  />
                </Field>
                <div className="split-grid">
                  <Field
                    label="핵심 개념"
                    helper="한 줄에 하나씩 입력합니다."
                  >
                    <textarea
                      value={rubricConcepts}
                      onChange={(event) => setRubricConcepts(event.target.value)}
                      rows={5}
                      className="form-textarea"
                      placeholder="예: 중력가속도"
                    />
                  </Field>
                  <Field
                    label="위험 신호"
                    helper="학생이 자주 헷갈리는 포인트를 적어 두면 질문과 분석에 반영됩니다."
                  >
                    <textarea
                      value={riskPoints}
                      onChange={(event) => setRiskPoints(event.target.value)}
                      rows={5}
                      className="form-textarea"
                      placeholder="예: 중력가속도와 속도 증가량을 혼동함"
                    />
                  </Field>
                </div>
                <Field
                  label="학생 제출물"
                  helper="학생 제출물 원문이나 핵심 발췌를 붙여 넣습니다."
                >
                  <textarea
                    value={submissionText}
                    onChange={(event) => setSubmissionText(event.target.value)}
                    rows={7}
                    className="form-textarea"
                    placeholder="학생 제출물 내용을 붙여 넣어 주세요."
                  />
                </Field>
                </div>
              </SurfaceCard>
            </div>

            <SurfaceCard
              eyebrow="2. 질문 세트"
              title="학생별 검증 질문"
              description="질문은 제출물과 루브릭을 바탕으로 생성됩니다."
              action={
                questionSet ? (
                  <button
                    type="button"
                    onClick={fillDemoAnswers}
                    className="button button--ghost button--compact"
                  >
                    데모 답변 채우기
                  </button>
                ) : undefined
              }
            >
              <QuestionSetPreview questionSet={questionSet} />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="3. 학생 답변"
              title="학생 답변과 전사 메타"
              description="학생 링크로 제출된 답변 또는 데모 답변을 검토합니다."
            >
              <StudentAnswerReview
                questionSet={questionSet}
                studentAnswers={studentAnswersForReview}
              />
            </SurfaceCard>

            <div data-tour="teacher-analysis">
              <SurfaceCard
                eyebrow="4. 분석 근거"
                title="분석 근거"
                description="누락 개념, 논리 충돌, 재설명 포인트를 먼저 확인합니다."
              >
                <AnalysisEvidenceReview analysisReport={analysisReport} />
              </SurfaceCard>
            </div>

            <div data-tour="teacher-decision">
              <SurfaceCard
                eyebrow="5. 교사 판단"
                title="교사 최종 판단"
                description="AI 결과를 그대로 통과시키지 말고, 교사 메모와 함께 최종 판단을 저장합니다."
                action={
                  <button
                    type="button"
                    onClick={handleSaveTeacherDecision}
                    disabled={isPending || !canSaveTeacherDecision}
                    className="button button--primary button--compact"
                  >
                    {activeAction === "decision"
                      ? "판단 저장 중..."
                      : "교사 판단 저장"}
                  </button>
                }
              >
                <div className="stack-grid">
                <div className="button-row">
                  {teacherDecisionOptions.map(([value, meta]) => (
                    <button
                      key={value}
                      type="button"
                      className="button button--ghost"
                      data-active={decisionDraft.decision === value}
                      onClick={() =>
                        setDecisionDraft((current) => ({
                          ...current,
                          decision: value,
                        }))
                      }
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
                <Field
                  label="교사 메모"
                  helper="판단 근거와 다음 지도 포인트만 간단히 남겨주세요."
                >
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
                    placeholder="예: 전이 질문에서 이유 설명은 좋았지만 반례 조건 설명이 약함"
                  />
                </Field>
                {teacherDecision ? (
                  <div className="summary-box">
                    <div className="badge-row">
                      <StatusBadge tone={teacherDecisionMeta[teacherDecision.decision].tone}>
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
                    아직 저장된 교사 판단이 없습니다.
                  </p>
                )}
                </div>
              </SurfaceCard>
            </div>
          </div>

          <div className="teacher-layout__side">
            <TeacherSessionPolicyCard
              sessionPreferences={sessionPreferences}
              workspaceSettingsSavedAt={workspaceSettingsSavedAt}
            />

            <div data-tour="teacher-student-link" className="section-stack">
              <TeacherStudentLinkCard
                verificationId={verificationId}
                studentUrl={studentUrl}
                studentPath={studentPath}
                studentAccessOpen={accessOpen}
                isPending={isPending}
                activeAction={activeAction}
                onCopyStudentLink={handleCopyStudentLink}
                onSyncLatestVerification={handleSyncLatestVerification}
              />

              <TeacherSessionControls
                verificationId={verificationId}
                studentAccessOpen={accessOpen}
                isPending={isPending}
                activeAction={activeAction}
                canAnalyze={canAnalyze}
                currentExportHref={currentExportHref}
                onToggleStudentAccess={handleToggleStudentAccess}
                onSyncLatestVerification={handleSyncLatestVerification}
                onRerunAnalysis={handleAnalyze}
              />
            </div>

            <SurfaceCard
              eyebrow="최근 세션"
              title="최근 세션 다시 열기"
              description="워크벤치를 벗어나지 않고 최근 세션을 다시 엽니다."
            >
              <VerificationSessionBrowser
                activeVerificationId={verificationId}
                onSelectVerification={handleSelectVerification}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="세션 기록"
              title="세션 기록"
              description="질문 생성부터 최종 판단까지의 기록입니다."
            >
              <SessionTimeline verificationId={verificationId} activity={activity} />
            </SurfaceCard>
          </div>
        </div>
      </div>
    </main>
  );
}
