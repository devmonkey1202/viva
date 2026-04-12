import { StatusBadge } from "@/components/status-badge";
import { DetailList } from "@/components/detail-list";
import { EmptyState } from "@/components/ui-blocks";
import { formatQuestionType } from "@/lib/presentation";
import type { QuestionSet } from "@/lib/schemas";

type QuestionSetPreviewProps = {
  questionSet: QuestionSet | null;
};

export function QuestionSetPreview({ questionSet }: QuestionSetPreviewProps) {
  if (!questionSet) {
    return (
      <EmptyState
        title="질문 세트가 아직 없습니다."
        description="과제와 루브릭을 확인한 뒤 질문 생성 버튼을 누르면 학생별 질문 세트가 만들어집니다."
      />
    );
  }

  return (
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
        <DetailList
          title="주의 메모"
          items={questionSet.cautionNotes}
          emptyText=""
        />
      ) : null}
    </div>
  );
}
