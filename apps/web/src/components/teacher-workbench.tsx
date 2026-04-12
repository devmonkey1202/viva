"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { StudentAnswerReview } from "@/components/student-answer-review";
import { EmptyState, Field, MetricCard, PageIntro, SurfaceCard } from "@/components/ui-blocks";
import { demoAnswerDraft, demoVerificationInput } from "@/lib/demo-data";
import {
  analysisClassificationMeta,
  buildStudentVerificationPath,
  buildStudentVerificationUrl,
  formatDateTime,
  formatQuestionType,
  teacherDecisionMeta,
} from "@/lib/presentation";
import type {
  AnalysisReport,
  AnalyzeUnderstandingResponse,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetResponse,
  GetVerificationResponse,
  QuestionSet,
  QuestionType,
  SaveTeacherDecisionResponse,
  StudentAnswer,
  TeacherDecision,
  TeacherDecisionInput,
  VerificationActivity,
} from "@/lib/schemas";

type TeacherWorkbenchProps = { aiConfigured: boolean; managedDatabase: boolean };
type AnswerDraft = Record<QuestionType, string>;
type AnswerArtifacts = Record<
  QuestionType,
  {
    inputMethod: "text" | "voice";
    rawTranscript?: string;
    normalizationNotes: string[];
    editedAfterTranscription?: boolean;
  }
>;

const teacherDecisionOptions = Object.entries(teacherDecisionMeta) as Array<
  [TeacherDecision["decision"], (typeof teacherDecisionMeta)[TeacherDecision["decision"]]]
>;

const initialAnswerState: AnswerDraft = { why: "", transfer: "", counterexample: "" };
const initialAnswerArtifacts: AnswerArtifacts = {
  why: { inputMethod: "text", normalizationNotes: [] },
  transfer: { inputMethod: "text", normalizationNotes: [] },
  counterexample: { inputMethod: "text", normalizationNotes: [] },
};
const initialDecisionState: TeacherDecisionInput = {
  decision: "approved_understanding",
  notes: "",
};

const parseMultilineInput = (value: string) =>
  value.split("\n").map((line) => line.trim()).filter(Boolean);

const answersFromStoredAnswers = (answers?: StudentAnswer[]): AnswerDraft => ({
  why: answers?.find((item) => item.type === "why")?.answer ?? "",
  transfer: answers?.find((item) => item.type === "transfer")?.answer ?? "",
  counterexample: answers?.find((item) => item.type === "counterexample")?.answer ?? "",
});

const artifactsFromStoredAnswers = (answers?: StudentAnswer[]): AnswerArtifacts => ({
  why: {
    inputMethod: answers?.find((item) => item.type === "why")?.inputMethod ?? "text",
    rawTranscript: answers?.find((item) => item.type === "why")?.rawTranscript,
    normalizationNotes: answers?.find((item) => item.type === "why")?.normalizationNotes ?? [],
    editedAfterTranscription: answers?.find((item) => item.type === "why")?.editedAfterTranscription,
  },
  transfer: {
    inputMethod: answers?.find((item) => item.type === "transfer")?.inputMethod ?? "text",
    rawTranscript: answers?.find((item) => item.type === "transfer")?.rawTranscript,
    normalizationNotes: answers?.find((item) => item.type === "transfer")?.normalizationNotes ?? [],
    editedAfterTranscription: answers?.find((item) => item.type === "transfer")?.editedAfterTranscription,
  },
  counterexample: {
    inputMethod: answers?.find((item) => item.type === "counterexample")?.inputMethod ?? "text",
    rawTranscript: answers?.find((item) => item.type === "counterexample")?.rawTranscript,
    normalizationNotes:
      answers?.find((item) => item.type === "counterexample")?.normalizationNotes ?? [],
    editedAfterTranscription:
      answers?.find((item) => item.type === "counterexample")?.editedAfterTranscription,
  },
});

const buildStudentAnswers = (
  questionSet: QuestionSet,
  answers: AnswerDraft,
  artifacts: AnswerArtifacts,
): StudentAnswer[] =>
  questionSet.questions.map((question) => {
    const artifact = artifacts[question.type];

    return {
      type: question.type,
      answer: answers[question.type].trim(),
      inputMethod: artifact.inputMethod,
      rawTranscript: artifact.rawTranscript?.trim() || undefined,
      normalizationNotes: artifact.normalizationNotes.length ? artifact.normalizationNotes : undefined,
      editedAfterTranscription: artifact.editedAfterTranscription,
    };
  });

function DetailList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="detail-list">
      <p className="detail-list__title">{title}</p>
      {items.length ? (
        <ul className="detail-list__items">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="helper-text">{emptyText}</p>
      )}
    </div>
  );
}

export function TeacherWorkbench({ aiConfigured, managedDatabase }: TeacherWorkbenchProps) {
  const [assignmentTitle, setAssignmentTitle] = useState(demoVerificationInput.assignmentTitle);
  const [assignmentDescription, setAssignmentDescription] = useState(demoVerificationInput.assignmentDescription);
  const [rubricConcepts, setRubricConcepts] = useState(demoVerificationInput.rubricCoreConcepts.join("\n"));
  const [riskPoints, setRiskPoints] = useState(demoVerificationInput.rubricRiskPoints.join("\n"));
  const [submissionText, setSubmissionText] = useState(demoVerificationInput.submissionText);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [teacherDecision, setTeacherDecision] = useState<TeacherDecision | null>(null);
  const [decisionDraft, setDecisionDraft] = useState<TeacherDecisionInput>(initialDecisionState);
  const [answers, setAnswers] = useState<AnswerDraft>(initialAnswerState);
  const [answerArtifacts, setAnswerArtifacts] = useState<AnswerArtifacts>(initialAnswerArtifacts);
  const [activity, setActivity] = useState<VerificationActivity[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [clientOrigin, setClientOrigin] = useState("");
  const [activeAction, setActiveAction] = useState<"questions" | "analysis" | "decision" | "sync" | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredSubmissionText = useDeferredValue(submissionText);

  useEffect(() => {
    setClientOrigin(window.location.origin);
  }, []);

  const verificationInput = {
    assignmentTitle,
    assignmentDescription,
    rubricCoreConcepts: parseMultilineInput(rubricConcepts),
    rubricRiskPoints: parseMultilineInput(riskPoints),
    submissionText,
  };
  const studentPath = verificationId ? buildStudentVerificationPath(verificationId) : null;
  const studentUrl = verificationId && clientOrigin ? buildStudentVerificationUrl(clientOrigin, verificationId) : "";
  const completionCount = Object.values(answers).filter((value) => value.trim().length > 0).length;
  const studentAnswersForReview = questionSet ? buildStudentAnswers(questionSet, answers, answerArtifacts) : [];
  const sessionStatus = teacherDecision
    ? "교사 판단 완료"
    : analysisReport
      ? "근거 검토 가능"
      : questionSet
        ? "학생 응답 대기"
        : "세션 준비 중";

  const applyVerificationPayload = (payload: GetVerificationResponse) => {
    const verification = payload.verification;
    setAssignmentTitle(verification.assignmentTitle);
    setAssignmentDescription(verification.assignmentDescription);
    setRubricConcepts(verification.rubricCoreConcepts.join("\n"));
    setRiskPoints(verification.rubricRiskPoints.join("\n"));
    setSubmissionText(verification.submissionText);
    setQuestionSet(verification.questionSet);
    setAnalysisReport(verification.analysisReport ?? null);
    setTeacherDecision(verification.teacherDecision ?? null);
    setAnswers(answersFromStoredAnswers(verification.studentAnswers));
    setAnswerArtifacts(artifactsFromStoredAnswers(verification.studentAnswers));
    setActivity(verification.activity);
    setDecisionDraft(
      verification.teacherDecision
        ? { decision: verification.teacherDecision.decision, notes: verification.teacherDecision.notes }
        : { decision: "approved_understanding", notes: verification.analysisReport?.teacherSummary ?? "" },
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
    setCopyMessage(null);
  };

  const generateQuestions = () => {
    setErrorMessage(null);
    setCopyMessage(null);
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
            error instanceof Error ? error.message : "질문 생성 중 오류가 발생했습니다.",
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
    setCopyMessage(null);
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
            error instanceof Error ? error.message : "세션 동기화 중 오류가 발생했습니다.",
          );
        } finally {
          setActiveAction(null);
        }
      })();
    });
  };

  const runAnalysis = (nextAnswers: AnswerDraft, nextArtifacts: AnswerArtifacts) => {
    if (!questionSet || !verificationId) {
      return;
    }

    setErrorMessage(null);
    setCopyMessage(null);
    setActiveAction("analysis");

    startTransition(() => {
      void (async () => {
        try {
          const requestBody: AnalyzeUnderstandingStoredRequest = {
            verificationId,
            ...verificationInput,
            questionSet,
            studentAnswers: buildStudentAnswers(questionSet, nextAnswers, nextArtifacts),
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
              message: `학생 답변을 분석했습니다. 분류: ${analysisClassificationMeta[payload.analysisReport.classification].label}`,
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
            error instanceof Error ? error.message : "이해 분석 중 오류가 발생했습니다.",
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
    setCopyMessage(null);
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
              message: `교사 최종 판단을 저장했습니다. 결정: ${teacherDecisionMeta[payload.teacherDecision.decision].label}`,
            },
          ]);
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

  const copyStudentLink = async () => {
    if (!studentUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopyMessage("학생 링크를 복사했습니다.");
    } catch {
      setCopyMessage("링크 복사에 실패했습니다. 직접 복사해 주세요.");
    }
  };

  return (
    <main className="app-shell">
      <AppHeader
        current="teacher"
        utility={
          <div className="button-row">
            <Link href="/api/export?format=csv" className="button button--ghost button--compact">
              CSV export
            </Link>
            <Link href="/operator" className="button button--ghost button--compact">
              운영 요약
            </Link>
          </div>
        }
      />

      <div className="page-stack">
        <PageIntro
          eyebrow="Teacher Workbench"
          title="과제 기준을 정리하고 학생 이해를 검토합니다."
          description="교사는 과제와 루브릭을 정리하고 학생별 질문을 만든 뒤, 학생 답변과 분석 근거를 검토해 최종 판단을 남깁니다."
          actions={
            <div className="button-row">
              <button type="button" onClick={resetToDemo} className="button button--ghost">
                데모 입력 불러오기
              </button>
              <button type="button" onClick={generateQuestions} disabled={isPending} className="button button--primary">
                {activeAction === "questions" ? "질문 생성 중..." : "질문 생성"}
              </button>
            </div>
          }
          meta={
            <div className="badge-row">
              <StatusBadge tone={aiConfigured ? "success" : "warning"}>
                {aiConfigured ? "실제 AI 연결" : "Mock fallback"}
              </StatusBadge>
              <StatusBadge tone={managedDatabase ? "success" : "warning"}>
                {managedDatabase ? "Managed DB" : "Local store"}
              </StatusBadge>
              <StatusBadge tone="neutral">{sessionStatus}</StatusBadge>
            </div>
          }
        />

        <div className="metric-grid">
          <MetricCard label="세션 상태" value={sessionStatus} note="질문 생성부터 교사 판단까지" />
          <MetricCard label="질문 세트" value={questionSet ? "준비됨" : "미생성"} note="학생 응답 링크와 함께 공유" />
          <MetricCard label="응답 수집" value={`${completionCount}/3`} note="학생 응답 또는 데모 답변 기준" />
        </div>

        {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}
        {copyMessage ? <div className="inline-notice">{copyMessage}</div> : null}

        <div className="teacher-layout">
          <div className="teacher-layout__main">
            <SurfaceCard eyebrow="1. Assignment Setup" title="과제와 루브릭을 정리합니다." description="질문과 분석은 아래 입력을 기준으로 작동합니다.">
              <div className="form-grid">
                <Field label="과제 제목">
                  <input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} className="form-input" />
                </Field>
                <Field label="과제 설명">
                  <textarea value={assignmentDescription} onChange={(event) => setAssignmentDescription(event.target.value)} rows={5} className="form-textarea" />
                </Field>
                <div className="split-grid">
                  <Field label="핵심 개념" helper="한 줄에 하나씩 입력합니다.">
                    <textarea value={rubricConcepts} onChange={(event) => setRubricConcepts(event.target.value)} rows={7} className="form-textarea" />
                  </Field>
                  <Field label="위험 포인트" helper="학생이 흔히 틀리거나 혼동하는 지점을 적습니다.">
                    <textarea value={riskPoints} onChange={(event) => setRiskPoints(event.target.value)} rows={7} className="form-textarea" />
                  </Field>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard eyebrow="2. Submission" title="학생 제출물을 기준과 함께 둡니다." description="질문은 제출물의 설명 구조와 표현을 기준으로 만들어집니다.">
              <Field label="제출물 본문">
                <textarea value={submissionText} onChange={(event) => setSubmissionText(event.target.value)} rows={14} className="form-textarea" />
              </Field>
              <div className="preview-panel">
                <p className="preview-panel__label">현재 제출물 미리보기</p>
                <p className="preview-panel__body">{deferredSubmissionText}</p>
              </div>
            </SurfaceCard>
          </div>

          <div className="teacher-layout__side">
            <SurfaceCard eyebrow="3. Question Set" title="학생별 질문 3개를 생성합니다." description="왜형, 전이형, 반례형 질문으로 이해 구조를 확인합니다.">
              {questionSet ? (
                <div className="stack-grid">
                  <div className="summary-box">
                    <p className="summary-box__label">생성 전략</p>
                    <p className="summary-box__body">{questionSet.overallStrategy}</p>
                  </div>
                  {questionSet.questions.map((question) => (
                    <div key={question.type} className="question-card">
                      <div className="question-card__head">
                        <strong>{formatQuestionType(question.type)}</strong>
                        <StatusBadge tone="neutral">{question.type}</StatusBadge>
                      </div>
                      <p className="question-card__body">{question.question}</p>
                      <p className="question-card__hint">{question.intent}</p>
                    </div>
                  ))}
                  {questionSet.cautionNotes.length > 0 ? (
                    <DetailList title="주의 메모" items={questionSet.cautionNotes} emptyText="" />
                  ) : null}
                </div>
              ) : (
                <EmptyState title="질문 세트가 아직 없습니다." description="과제와 루브릭을 확인한 뒤 질문 생성 버튼을 누르면 학생별 질문 세트가 만들어집니다." />
              )}
            </SurfaceCard>

            <SurfaceCard eyebrow="4. Student Link" title="학생 응답 링크를 공유합니다." description="학생은 별도 화면에서 질문에 답하고, 교사는 이 화면에서 결과를 다시 불러옵니다.">
              {verificationId ? (
                <div className="stack-grid">
                  <div className="field-block">
                    <span className="field-block__label">학생용 경로</span>
                    <input readOnly value={studentUrl || studentPath || ""} className="form-input form-input--mono" />
                  </div>
                  <div className="button-row">
                    <button type="button" onClick={copyStudentLink} className="button button--secondary">
                      링크 복사
                    </button>
                    <Link href={studentPath ?? "#"} target="_blank" className="button button--ghost">
                      학생 화면 열기
                    </Link>
                    <button type="button" onClick={syncLatestVerification} disabled={isPending} className="button button--ghost">
                      {activeAction === "sync" ? "동기화 중..." : "최신 결과 불러오기"}
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState title="학생 링크는 질문 생성 뒤에 활성화됩니다." description="질문 세트가 먼저 생성되어야 학생별 링크가 만들어집니다." />
              )}
            </SurfaceCard>

            <SurfaceCard eyebrow="Demo Run" title="시연용 자동 응답을 바로 돌릴 수 있습니다." description="실제 학생 응답이 없을 때 제품 흐름을 빠르게 검증하는 용도입니다.">
              <div className="button-row">
                <button type="button" onClick={fillDemoAnswersAndAnalyze} disabled={!questionSet || isPending} className="button button--secondary">
                  {activeAction === "analysis" ? "시연 분석 중..." : "샘플 답변으로 분석"}
                </button>
              </div>
            </SurfaceCard>
          </div>
        </div>

        <div className="review-layout">
          <div className="review-layout__main">
            <SurfaceCard eyebrow="5. Student Answers" title="학생 답변과 입력 메타를 먼저 확인합니다." description="실제 답변, 음성 전사 여부, 전사 후 수정 여부를 먼저 확인합니다.">
              <StudentAnswerReview questionSet={questionSet} studentAnswers={studentAnswersForReview} />
            </SurfaceCard>
            <SurfaceCard eyebrow="6. Evidence Review" title="AI 분석 결과와 근거를 검토합니다." description="분류명보다 근거 구조와 빠진 개념, 충돌 지점을 먼저 봅니다." action={analysisReport ? <StatusBadge tone={analysisClassificationMeta[analysisReport.classification].tone}>{analysisClassificationMeta[analysisReport.classification].label}</StatusBadge> : undefined}>
              {analysisReport ? (
                <div className="stack-grid">
                  <div className="summary-box summary-box--accent">
                    <div className="badge-row">
                      <StatusBadge tone={analysisClassificationMeta[analysisReport.classification].tone}>{analysisClassificationMeta[analysisReport.classification].label}</StatusBadge>
                      <StatusBadge tone="neutral">신뢰도 {analysisReport.confidenceBand}</StatusBadge>
                    </div>
                    <p className="summary-box__body">{analysisReport.teacherSummary}</p>
                    <p className="helper-text">{analysisClassificationMeta[analysisReport.classification].note}</p>
                  </div>
                  <div className="evidence-grid">
                    <DetailList title="빠진 개념" items={analysisReport.conceptCoverage.missingConcepts} emptyText="누락된 핵심 개념이 없습니다." />
                    <DetailList title="재설명 포인트" items={analysisReport.reteachingPoints} emptyText="즉시 재설명할 포인트가 없습니다." />
                    <DetailList title="정렬 근거" items={analysisReport.semanticAlignment.evidence} emptyText="정렬 근거가 없습니다." />
                    <DetailList title="위험 신호" items={analysisReport.riskFlags} emptyText="추가 위험 신호가 없습니다." />
                  </div>
                  <div className="evidence-grid">
                    <DetailList title="오개념 라벨" items={analysisReport.misconceptionLabels} emptyText="반복 오개념 라벨이 없습니다." />
                    <DetailList title="전이 능력 근거" items={analysisReport.transferAbility.evidence} emptyText="전이 근거가 충분하지 않습니다." />
                  </div>
                  <div className="detail-list">
                    <p className="detail-list__title">충돌 문장</p>
                    {analysisReport.contradictionCheck.contradictions.length > 0 ? (
                      <div className="stack-grid">
                        {analysisReport.contradictionCheck.contradictions.map((item) => (
                          <div key={`${item.submissionClaim}-${item.answerClaim}`} className="contradiction-card">
                            <p className="contradiction-card__label">제출물 주장</p>
                            <p className="contradiction-card__body">{item.submissionClaim}</p>
                            <p className="contradiction-card__label">답변 주장</p>
                            <p className="contradiction-card__body">{item.answerClaim}</p>
                            <p className="contradiction-card__hint">{item.explanation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="helper-text">충돌 문장이 없습니다.</p>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState title="아직 검토할 분석 결과가 없습니다." description="학생 응답이 제출되거나 시연용 자동 응답을 돌린 뒤 분석 근거가 여기에 나타납니다." />
              )}
            </SurfaceCard>
          </div>

          <div className="review-layout__side">
            <SurfaceCard eyebrow="7. Teacher Decision" title="교사 최종 판단을 저장합니다." description="AI 분석과 별도로 교사 판단을 남겨 최종 책임을 유지합니다.">
              <div className="decision-options">
                {teacherDecisionOptions.map(([decision, meta]) => (
                  <button key={decision} type="button" data-active={decisionDraft.decision === decision} onClick={() => setDecisionDraft((current) => ({ ...current, decision }))} className="option-button">
                    {meta.label}
                  </button>
                ))}
              </div>
              <Field label="교사 메모" helper="최종 판단 근거를 짧게 남깁니다.">
                <textarea value={decisionDraft.notes} onChange={(event) => setDecisionDraft((current) => ({ ...current, notes: event.target.value }))} rows={5} className="form-textarea" />
              </Field>
              <div className="button-row">
                <button type="button" onClick={saveTeacherDecision} disabled={isPending || !verificationId || !analysisReport} className="button button--primary">
                  {activeAction === "decision" ? "판단 저장 중..." : "교사 판단 저장"}
                </button>
              </div>
              {teacherDecision ? (
                <div className="summary-box">
                  <div className="badge-row">
                    <StatusBadge tone={teacherDecisionMeta[teacherDecision.decision].tone}>{teacherDecisionMeta[teacherDecision.decision].label}</StatusBadge>
                    <StatusBadge tone="neutral">{formatDateTime(teacherDecision.decidedAt)}</StatusBadge>
                  </div>
                  <p className="summary-box__body">{teacherDecision.notes}</p>
                </div>
              ) : (
                <p className="helper-text">아직 저장된 교사 최종 판단이 없습니다.</p>
              )}
            </SurfaceCard>
            <SurfaceCard eyebrow="Session Record" title="세션 기록" description="질문 생성, 분석, 교사 판단 저장 흐름을 확인합니다.">
              <div className="stack-grid">
                <div className="summary-box">
                  <p className="summary-box__label">세션 ID</p>
                  <p className="summary-box__mono">{verificationId ?? "미생성"}</p>
                </div>
                {activity.length > 0 ? (
                  <ul className="timeline-list">
                    {activity.map((item, index) => (
                      <li key={`${item.recordedAt}-${index}`} className="timeline-list__item">
                        <span className="timeline-list__dot" />
                        <div>
                          <p className="timeline-list__title">{item.message}</p>
                          <p className="timeline-list__meta">{formatDateTime(item.recordedAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="helper-text">아직 기록된 세션 활동이 없습니다.</p>
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </main>
  );
}
