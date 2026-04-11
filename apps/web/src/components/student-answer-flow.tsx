"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Field, PageIntro, SurfaceCard } from "@/components/ui-blocks";
import {
  analysisClassificationMeta,
  formatQuestionType,
  questionTypeMeta,
} from "@/lib/presentation";
import type {
  AnalyzeUnderstandingResponse,
  AnalyzeUnderstandingStoredRequest,
  QuestionType,
  VerificationRecord,
} from "@/lib/schemas";

type StudentAnswerFlowProps = {
  verification: VerificationRecord;
};

const buildInitialAnswers = (verification: VerificationRecord) => ({
  why:
    verification.studentAnswers?.find((item) => item.type === "why")?.answer ?? "",
  transfer:
    verification.studentAnswers?.find((item) => item.type === "transfer")?.answer ??
    "",
  counterexample:
    verification.studentAnswers?.find((item) => item.type === "counterexample")
      ?.answer ?? "",
});

export function StudentAnswerFlow({ verification }: StudentAnswerFlowProps) {
  const [answers, setAnswers] = useState<Record<QuestionType, string>>(
    buildInitialAnswers(verification),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(
    Boolean(verification.analysisReport),
  );
  const [isPending, startTransition] = useTransition();

  const questionSet = verification.questionSet;
  const alreadyAnalyzed = Boolean(verification.analysisReport);

  const submitAnswers = () => {
    if (!questionSet || alreadyAnalyzed) {
      return;
    }

    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const requestBody: AnalyzeUnderstandingStoredRequest = {
            verificationId: verification.verificationId,
            assignmentTitle: verification.assignmentTitle,
            assignmentDescription: verification.assignmentDescription,
            rubricCoreConcepts: verification.rubricCoreConcepts,
            rubricRiskPoints: verification.rubricRiskPoints,
            submissionText: verification.submissionText,
            questionSet,
            studentAnswers: questionSet.questions.map((question) => ({
              type: question.type,
              answer: answers[question.type].trim(),
            })),
          };

          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "답변 제출 중 오류가 발생했습니다.");
          }

          const payload = (await response.json()) as AnalyzeUnderstandingResponse;

          if (payload.analysisReport) {
            setIsSubmitted(true);
          }
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "답변 제출 중 오류가 발생했습니다.",
          );
        }
      })();
    });
  };

  const completionCount = questionSet.questions.filter(
    (question) => answers[question.type].trim().length > 0,
  ).length;

  return (
    <main className="student-shell">
      <AppHeader current="student" minimal />

      <div className="student-layout">
        <PageIntro
          eyebrow="Student Answer Flow"
          title="질문에 짧고 분명하게 답해주세요."
          description="정답을 길게 적는 것보다, 왜 그렇게 이해했는지 또렷하게 설명하는 것이 중요합니다. 답변이 제출되면 교사가 근거를 검토합니다."
          meta={
            <div className="student-progress">
              <div className="student-progress__count">
                <span>{completionCount}</span>
                <span>/ {questionSet.questions.length} 문항 작성</span>
              </div>
              <div className="student-progress__track">
                <div
                  className="student-progress__value"
                  style={{
                    width: `${(completionCount / questionSet.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          }
        />

        <SurfaceCard
          tone="muted"
          eyebrow="Assignment"
          title={verification.assignmentTitle}
          description={verification.assignmentDescription}
        >
          <div className="student-summary">
            <div className="stack-list">
              <p className="stack-list__label">교사가 보고 싶은 핵심 개념</p>
              <div className="token-row">
                {verification.rubricCoreConcepts.map((concept) => (
                  <span key={concept} className="token-chip">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>

        {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}

        {isSubmitted ? (
          <SurfaceCard
            tone="accent"
            eyebrow="Submitted"
            title="답변 제출이 완료되었습니다."
            description="이 화면의 분류 결과는 학생에게 직접 보여주지 않습니다. 교사가 제출물과 답변을 함께 검토한 뒤 최종 판단합니다."
          >
            <div className="completion-card">
              <StatusBadge tone="success">제출 완료</StatusBadge>
              <p className="completion-card__body">
                교사는 제출물, 질문, 답변, 루브릭을 함께 검토합니다.
              </p>
              {verification.analysisReport ? (
                <p className="completion-card__hint">
                  내부 분석 상태:{" "}
                  {
                    analysisClassificationMeta[
                      verification.analysisReport.classification
                    ].label
                  }
                </p>
              ) : null}
            </div>
          </SurfaceCard>
        ) : (
          <div className="student-question-list">
            {questionSet.questions
              .toSorted(
                (left, right) =>
                  questionTypeMeta[left.type].order -
                  questionTypeMeta[right.type].order,
              )
              .map((question, index) => (
                <SurfaceCard
                  key={question.type}
                  eyebrow={`${index + 1}. ${formatQuestionType(question.type)}`}
                  title={question.question}
                  description={question.intent}
                >
                  <Field
                    label="답변"
                    helper="한두 문장으로 핵심 이유를 먼저 적고, 필요하면 조건이나 예외를 덧붙이세요."
                  >
                    <textarea
                      value={answers[question.type]}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.type]: event.target.value,
                        }))
                      }
                      rows={5}
                      className="form-textarea"
                      placeholder="답변을 입력하세요."
                    />
                  </Field>
                </SurfaceCard>
              ))}

            <div className="student-footer">
              <p className="student-footer__note">
                제출 후에는 교사가 검토하기 전까지 수정이 제한될 수 있습니다.
              </p>
              <button
                type="button"
                onClick={submitAnswers}
                disabled={isPending || completionCount !== questionSet.questions.length}
                className="button button--primary button--full"
              >
                {isPending ? "답변 제출 중..." : "답변 제출"}
              </button>
            </div>
          </div>
        )}

        <EmptyState
          title="교사용 화면은 별도로 분리됩니다."
          description="이 화면은 학생의 답변 입력에만 집중합니다. 교사는 별도의 검토 화면에서 분석 근거와 최종 판단을 확인합니다."
          action={
            <Link href="/" className="button button--ghost">
              서비스 소개 보기
            </Link>
          }
        />
      </div>
    </main>
  );
}
