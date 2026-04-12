"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
  StudentAnswer,
  VerificationRecord,
} from "@/lib/schemas";

type StudentAnswerFlowProps = {
  verification: VerificationRecord;
};

type StudentAnswerArtifact = {
  inputMethod: "text" | "voice";
  rawTranscript?: string;
  normalizationNotes: string[];
  editedAfterTranscription?: boolean;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

const initialLiveTranscript: Record<QuestionType, string> = {
  why: "",
  transfer: "",
  counterexample: "",
};

const normalizeTranscript = (value: string) => {
  const notes: string[] = [];
  const trimmed = value.trim();
  const withoutLineBreaks = trimmed.replace(/\s*\n+\s*/g, " ");
  const singleSpaced = withoutLineBreaks.replace(/\s+/g, " ");
  const normalized = singleSpaced.replace(/\s+([,.!?])/g, "$1");

  if (trimmed !== singleSpaced) {
    notes.push("전사 텍스트의 공백과 줄바꿈을 정리했습니다.");
  }

  if (singleSpaced !== normalized) {
    notes.push("구두점 앞 공백을 정리했습니다.");
  }

  return {
    text: normalized,
    notes,
  };
};

const mergeVoiceText = (current: string, incoming: string) =>
  current.trim().length > 0 ? `${current.trim()} ${incoming}`.trim() : incoming;

const uniqueNotes = (values: string[]) => [...new Set(values.filter(Boolean))];

const speechErrorMessage = (error: string) => {
  switch (error) {
    case "audio-capture":
      return "마이크를 찾을 수 없습니다. 텍스트 입력으로 계속 진행할 수 있습니다.";
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한이 없어 음성 입력을 사용할 수 없습니다.";
    case "network":
      return "음성 인식 중 네트워크 오류가 발생했습니다. 텍스트 입력으로 계속 진행할 수 있습니다.";
    case "no-speech":
      return "음성이 감지되지 않았습니다. 다시 시도하거나 텍스트로 입력해 주세요.";
    default:
      return "음성 인식 중 오류가 발생했습니다. 텍스트 입력으로 계속 진행할 수 있습니다.";
  }
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

const buildInitialArtifacts = (
  verification: VerificationRecord,
): Record<QuestionType, StudentAnswerArtifact> => {
  const byType = (type: QuestionType) =>
    verification.studentAnswers?.find((item) => item.type === type);

  const toArtifact = (answer: StudentAnswer | undefined): StudentAnswerArtifact => ({
    inputMethod: answer?.inputMethod ?? "text",
    rawTranscript: answer?.rawTranscript,
    normalizationNotes: answer?.normalizationNotes ?? [],
    editedAfterTranscription: answer?.editedAfterTranscription,
  });

  return {
    why: toArtifact(byType("why")),
    transfer: toArtifact(byType("transfer")),
    counterexample: toArtifact(byType("counterexample")),
  };
};

export function StudentAnswerFlow({ verification }: StudentAnswerFlowProps) {
  const [answers, setAnswers] = useState<Record<QuestionType, string>>(
    buildInitialAnswers(verification),
  );
  const [answerArtifacts, setAnswerArtifacts] = useState<
    Record<QuestionType, StudentAnswerArtifact>
  >(buildInitialArtifacts(verification));
  const [liveTranscript, setLiveTranscript] =
    useState<Record<QuestionType, string>>(initialLiveTranscript);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listeningQuestion, setListeningQuestion] = useState<QuestionType | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sttMessage, setSttMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(
    Boolean(verification.analysisReport),
  );
  const [isPending, startTransition] = useTransition();
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const questionSet = verification.questionSet;
  const alreadyAnalyzed = Boolean(verification.analysisReport);

  useEffect(() => {
    const browserWindow = window as BrowserWindow;
    const Recognition =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    setSpeechSupported(Boolean(Recognition));

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const completionCount = questionSet.questions.filter(
    (question) => answers[question.type].trim().length > 0,
  ).length;

  const supportDescription = useMemo(() => {
    if (speechSupported) {
      return "마이크가 허용되면 음성 답변을 바로 전사할 수 있습니다. 전사 실패 시 텍스트 입력으로 계속 진행할 수 있습니다.";
    }

    return "현재 브라우저에서는 음성 입력이 지원되지 않아 텍스트 입력으로 진행합니다.";
  }, [speechSupported]);

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const commitVoiceTranscript = (type: QuestionType, transcript: string) => {
    const normalized = normalizeTranscript(transcript);

    setAnswers((current) => ({
      ...current,
      [type]: mergeVoiceText(current[type], normalized.text),
    }));
    setAnswerArtifacts((current) => ({
      ...current,
      [type]: {
        inputMethod: "voice",
        rawTranscript: mergeVoiceText(
          current[type].rawTranscript ?? "",
          transcript.trim(),
        ),
        normalizationNotes: uniqueNotes([
          ...current[type].normalizationNotes,
          ...normalized.notes,
        ]),
        editedAfterTranscription: current[type].editedAfterTranscription,
      },
    }));
  };

  const startListening = (type: QuestionType) => {
    const browserWindow = window as BrowserWindow;
    const Recognition =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setSpeechSupported(false);
      setErrorMessage(
        "이 브라우저는 음성 입력을 지원하지 않습니다. 텍스트 입력으로 계속 진행할 수 있습니다.",
      );
      return;
    }

    if (listeningQuestion === type) {
      stopListening();
      return;
    }

    recognitionRef.current?.stop();
    setErrorMessage(null);
    setSttMessage(null);
    setListeningQuestion(type);
    setLiveTranscript((current) => ({ ...current, [type]: "" }));

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let errored = false;

    recognition.onresult = (event) => {
      let interim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result[0];

        if (!alternative?.transcript) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript = mergeVoiceText(finalTranscript, alternative.transcript);
        } else {
          interim = mergeVoiceText(interim, alternative.transcript);
        }
      }

      setLiveTranscript((current) => ({
        ...current,
        [type]: interim,
      }));
    };

    recognition.onerror = (event) => {
      errored = true;
      setErrorMessage(speechErrorMessage(event.error));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListeningQuestion((current) => (current === type ? null : current));
      setLiveTranscript((current) => ({ ...current, [type]: "" }));

      if (finalTranscript.trim().length > 0) {
        commitVoiceTranscript(type, finalTranscript);
        setSttMessage("음성 답변을 텍스트로 반영했습니다. 필요하면 직접 수정할 수 있습니다.");
        return;
      }

      if (!errored) {
        setSttMessage("음성이 감지되지 않았습니다. 텍스트 입력으로 계속 진행할 수 있습니다.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const updateTypedAnswer = (type: QuestionType, value: string) => {
    setAnswers((current) => ({
      ...current,
      [type]: value,
    }));

    setAnswerArtifacts((current) => {
      const artifact = current[type];
      const usedVoice = Boolean(artifact.rawTranscript?.trim());

      return {
        ...current,
        [type]: {
          ...artifact,
          inputMethod: usedVoice ? "voice" : "text",
          editedAfterTranscription: usedVoice ? true : undefined,
        },
      };
    });
  };

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
              inputMethod: answerArtifacts[question.type].inputMethod,
              rawTranscript:
                answerArtifacts[question.type].rawTranscript?.trim() || undefined,
              normalizationNotes:
                answerArtifacts[question.type].normalizationNotes.length > 0
                  ? answerArtifacts[question.type].normalizationNotes
                  : undefined,
              editedAfterTranscription:
                answerArtifacts[question.type].editedAfterTranscription,
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
            <div className="summary-box">
              <p className="summary-box__label">답변 방식</p>
              <p className="summary-box__body">{supportDescription}</p>
            </div>
          </div>
        </SurfaceCard>

        {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}
        {sttMessage ? <div className="inline-notice">{sttMessage}</div> : null}

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
              .map((question, index) => {
                const artifact = answerArtifacts[question.type];
                const isListening = listeningQuestion === question.type;
                const interimTranscript = liveTranscript[question.type];

                return (
                  <SurfaceCard
                    key={question.type}
                    eyebrow={`${index + 1}. ${formatQuestionType(question.type)}`}
                    title={question.question}
                    description={question.intent}
                  >
                    <div className="voice-toolbar">
                      {speechSupported ? (
                        <button
                          type="button"
                          onClick={() => startListening(question.type)}
                          className="button button--secondary button--compact"
                        >
                          {isListening ? "음성 입력 중지" : "음성으로 답하기"}
                        </button>
                      ) : null}
                      <div className="badge-row">
                        {speechSupported ? (
                          <StatusBadge tone={isListening ? "accent" : "neutral"}>
                            {isListening ? "음성 인식 중" : "음성 입력 가능"}
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">텍스트 입력만 가능</StatusBadge>
                        )}
                        <StatusBadge
                          tone={artifact.inputMethod === "voice" ? "info" : "neutral"}
                        >
                          {artifact.inputMethod === "voice" ? "음성 전사 답변" : "텍스트 답변"}
                        </StatusBadge>
                        {artifact.editedAfterTranscription ? (
                          <StatusBadge tone="warning">전사 후 직접 수정</StatusBadge>
                        ) : null}
                      </div>
                    </div>

                    {isListening || interimTranscript ? (
                      <div className="voice-preview">
                        <p className="voice-preview__label">실시간 전사</p>
                        <p className="voice-preview__body">
                          {interimTranscript || "음성을 듣는 중입니다..."}
                        </p>
                      </div>
                    ) : null}

                    {artifact.rawTranscript ? (
                      <div className="voice-preview voice-preview--muted">
                        <p className="voice-preview__label">최근 음성 전사 원문</p>
                        <p className="voice-preview__body">{artifact.rawTranscript}</p>
                        {artifact.normalizationNotes.length > 0 ? (
                          <ul className="voice-preview__notes">
                            {artifact.normalizationNotes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}

                    <Field
                      label="답변"
                      helper="한두 문장으로 핵심 이유를 먼저 적고, 필요하면 조건이나 예외를 덧붙이세요."
                    >
                      <textarea
                        value={answers[question.type]}
                        onChange={(event) =>
                          updateTypedAnswer(question.type, event.target.value)
                        }
                        rows={5}
                        className="form-textarea"
                        placeholder="답변을 입력하세요."
                      />
                    </Field>
                  </SurfaceCard>
                );
              })}

            <div className="student-footer">
              <p className="student-footer__note">
                음성 입력이 실패해도 텍스트로 바로 이어서 답할 수 있습니다. 제출
                후에는 교사가 검토하기 전까지 수정이 제한될 수 있습니다.
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
