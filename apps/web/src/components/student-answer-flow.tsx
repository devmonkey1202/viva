"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { StudentQuestionCard } from "@/components/student-question-card";
import { EmptyState, PageIntro, SurfaceCard } from "@/components/ui-blocks";
import {
  analysisClassificationMeta,
  formatQuestionType,
  questionTypeMeta,
} from "@/lib/presentation";
import type {
  AnalyzeUnderstandingResponse,
  QuestionType,
  VerificationRecord,
} from "@/lib/schemas";
import {
  type StudentAnswerArtifact,
  buildAnalyzeRequest,
  buildInitialAnswers,
  buildInitialArtifacts,
  initialLiveTranscript,
  mergeVoiceText,
  normalizeTranscript,
  speechErrorMessage,
  uniqueNotes,
} from "@/lib/student-answer-flow";

type StudentAnswerFlowProps = {
  verification: VerificationRecord;
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

export function StudentAnswerFlow({ verification }: StudentAnswerFlowProps) {
  const [answers, setAnswers] = useState<Record<QuestionType, string>>(
    buildInitialAnswers(verification),
  );
  const [answerArtifacts, setAnswerArtifacts] = useState<
    Record<QuestionType, StudentAnswerArtifact>
  >(buildInitialArtifacts(verification));
  const [liveTranscript, setLiveTranscript] = useState(initialLiveTranscript);
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
    const recognition =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    setSpeechSupported(Boolean(recognition));

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
      return "마이크가 있으면 음성 답변을 바로 전사할 수 있습니다. 전사 실패 시 텍스트 입력으로 계속 진행할 수 있습니다.";
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
        "이 브라우저에서는 음성 입력이 지원되지 않습니다. 텍스트 입력으로 계속 진행할 수 있습니다.",
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

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
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
        setSttMessage(
          "음성 답변을 텍스트로 반영했습니다. 필요하면 직접 수정할 수 있습니다.",
        );
        return;
      }

      if (!errored) {
        setSttMessage(
          "음성이 감지되지 않았습니다. 텍스트 입력으로 계속 진행할 수 있습니다.",
        );
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
    if (alreadyAnalyzed) {
      return;
    }

    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              buildAnalyzeRequest({
                verification,
                questionSet,
                answers,
                answerArtifacts,
              }),
            ),
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
          title="질문에 짧고 분명하게 답해 주세요."
          description="정답을 길게 쓰는 것보다 왜 그렇게 이해했는지 드러내는 답변이 중요합니다. 답변은 교사의 검토 자료로만 사용됩니다."
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
            description="이 화면은 학생에게 분석 세부 결과를 직접 보여주지 않습니다. 교사가 제출물과 답변을 함께 검토한 뒤 최종 판단합니다."
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
                <StudentQuestionCard
                  key={question.type}
                  index={index}
                  question={question}
                  answer={answers[question.type]}
                  artifact={answerArtifacts[question.type]}
                  interimTranscript={liveTranscript[question.type]}
                  speechSupported={speechSupported}
                  isListening={listeningQuestion === question.type}
                  onToggleListening={startListening}
                  onChangeAnswer={updateTypedAnswer}
                  formatQuestionType={formatQuestionType}
                />
              ))}

            <div className="student-footer">
              <p className="student-footer__note">
                음성 입력이 실패해도 텍스트로 바로 이어서 답할 수 있습니다.
                제출 전까지는 직접 수정할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={submitAnswers}
                disabled={
                  isPending || completionCount !== questionSet.questions.length
                }
                className="button button--primary button--full"
              >
                {isPending ? "답변 제출 중..." : "답변 제출"}
              </button>
            </div>
          </div>
        )}

        <EmptyState
          title="교사 검토 화면과 분리된 응답 전용 화면입니다."
          description="이 화면은 학생 답변 수집에만 집중합니다. 교사는 별도의 검토 화면에서 분석 근거와 최종 판단을 확인합니다."
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
