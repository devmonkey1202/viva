"use client";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui-blocks";
import {
  formatQuestionType,
  questionTypeMeta,
  studentInputMethodMeta,
} from "@/lib/presentation";
import type { QuestionSet, StudentAnswer, QuestionType } from "@/lib/schemas";

type StudentAnswerReviewProps = {
  questionSet: QuestionSet | null;
  studentAnswers: StudentAnswer[];
};

const sortQuestionTypes = (left: QuestionType, right: QuestionType) =>
  questionTypeMeta[left].order - questionTypeMeta[right].order;

export function StudentAnswerReview({
  questionSet,
  studentAnswers,
}: StudentAnswerReviewProps) {
  if (!questionSet) {
    return (
      <EmptyState
        title="질문 세트가 아직 없습니다."
        description="질문 세트가 생성된 뒤에야 학생 답변을 이 영역에서 검토할 수 있습니다."
      />
    );
  }

  const answersByType = new Map(studentAnswers.map((answer) => [answer.type, answer]));
  const hasAnyAnswer = studentAnswers.some((answer) => answer.answer.trim().length > 0);

  if (!hasAnyAnswer) {
    return (
      <EmptyState
        title="제출된 학생 답변이 아직 없습니다."
        description="학생 링크를 공유한 뒤 최신 결과를 불러오면 답변과 전사 메타를 여기서 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="stack-grid">
      {questionSet.questions
        .toSorted((left, right) => sortQuestionTypes(left.type, right.type))
        .map((question) => {
          const answer = answersByType.get(question.type);
          const inputMeta = studentInputMethodMeta[answer?.inputMethod ?? "text"];

          return (
            <div key={question.type} className="question-card">
              <div className="question-card__head">
                <strong>{formatQuestionType(question.type)}</strong>
                <div className="badge-row">
                  <StatusBadge tone="neutral">{question.type}</StatusBadge>
                  <StatusBadge tone={inputMeta.tone}>{inputMeta.label}</StatusBadge>
                  {answer?.editedAfterTranscription ? (
                    <StatusBadge tone="warning">전사 후 직접 수정</StatusBadge>
                  ) : null}
                </div>
              </div>
              <p className="question-card__hint">{question.question}</p>
              <p className="question-card__body">
                {answer?.answer ?? "아직 저장된 답변이 없습니다."}
              </p>

              {answer?.rawTranscript ? (
                <div className="summary-box">
                  <p className="summary-box__label">음성 전사 원문</p>
                  <p className="summary-box__body">{answer.rawTranscript}</p>
                </div>
              ) : null}

              {answer?.normalizationNotes?.length ? (
                <ul className="detail-list__items">
                  {answer.normalizationNotes.map((note) => (
                    <li key={`${question.type}-${note}`}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}
