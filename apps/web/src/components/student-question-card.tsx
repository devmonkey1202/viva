import { Field, SurfaceCard } from "@/components/ui-blocks";
import { StatusBadge } from "@/components/status-badge";
import type { QuestionItem, QuestionType } from "@/lib/schemas";

type StudentQuestionArtifact = {
  inputMethod: "text" | "voice";
  rawTranscript?: string;
  normalizationNotes: string[];
  editedAfterTranscription?: boolean;
};

type StudentQuestionCardProps = {
  index: number;
  question: QuestionItem;
  answer: string;
  artifact: StudentQuestionArtifact;
  interimTranscript: string;
  speechSupported: boolean;
  isListening: boolean;
  onToggleListening: (type: QuestionType) => void;
  onChangeAnswer: (type: QuestionType, value: string) => void;
  formatQuestionType: (type: QuestionType) => string;
};

export function StudentQuestionCard({
  index,
  question,
  answer,
  artifact,
  interimTranscript,
  speechSupported,
  isListening,
  onToggleListening,
  onChangeAnswer,
  formatQuestionType,
}: StudentQuestionCardProps) {
  return (
    <SurfaceCard
      eyebrow={`${index + 1}. ${formatQuestionType(question.type)}`}
      title={question.question}
      description={question.intent}
    >
      <div className="voice-toolbar">
        {speechSupported ? (
          <button
            type="button"
            onClick={() => onToggleListening(question.type)}
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
        helper="서두 문장으로 이유를 먼저 쓰고, 필요하면 조건이나 예외를 덧붙이세요."
      >
        <textarea
          value={answer}
          onChange={(event) => onChangeAnswer(question.type, event.target.value)}
          rows={5}
          className="form-textarea"
          placeholder="답변을 입력하세요."
        />
      </Field>
    </SurfaceCard>
  );
}
