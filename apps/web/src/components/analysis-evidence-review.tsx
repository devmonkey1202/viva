import { DetailList } from "@/components/detail-list";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui-blocks";
import { analysisClassificationMeta } from "@/lib/presentation";
import type { AnalysisReport } from "@/lib/schemas";

type AnalysisEvidenceReviewProps = {
  analysisReport: AnalysisReport | null;
};

export function AnalysisEvidenceReview({
  analysisReport,
}: AnalysisEvidenceReviewProps) {
  if (!analysisReport) {
    return (
      <EmptyState
        title="아직 검토할 분석 결과가 없습니다."
        description="학생 응답을 제출하거나 시연용 자동 응답을 돌린 뒤 분석 근거가 여기에 채워집니다."
      />
    );
  }

  const classificationMeta =
    analysisClassificationMeta[analysisReport.classification];

  return (
    <div className="stack-grid">
      <div className="summary-box summary-box--accent">
        <div className="badge-row">
          <StatusBadge tone={classificationMeta.tone}>
            {classificationMeta.label}
          </StatusBadge>
          <StatusBadge tone="neutral">
            신뢰도 {analysisReport.confidenceBand}
          </StatusBadge>
        </div>
        <p className="summary-box__body">{analysisReport.teacherSummary}</p>
        <p className="helper-text">{classificationMeta.note}</p>
      </div>
      <div className="evidence-grid">
        <DetailList
          title="빠진 개념"
          items={analysisReport.conceptCoverage.missingConcepts}
          emptyText="누락된 핵심 개념이 없습니다."
        />
        <DetailList
          title="재설명 포인트"
          items={analysisReport.reteachingPoints}
          emptyText="즉시 재설명할 포인트가 없습니다."
        />
        <DetailList
          title="정렬 근거"
          items={analysisReport.semanticAlignment.evidence}
          emptyText="정렬 근거가 없습니다."
        />
        <DetailList
          title="위험 신호"
          items={analysisReport.riskFlags}
          emptyText="추가 위험 신호가 없습니다."
        />
      </div>
      <div className="evidence-grid">
        <DetailList
          title="오개념 라벨"
          items={analysisReport.misconceptionLabels}
          emptyText="반복 오개념 라벨이 없습니다."
        />
        <DetailList
          title="전이 능력 근거"
          items={analysisReport.transferAbility.evidence}
          emptyText="전이 근거가 충분하지 않습니다."
        />
      </div>
      <div className="detail-list">
        <p className="detail-list__title">충돌 문장</p>
        {analysisReport.contradictionCheck.contradictions.length > 0 ? (
          <div className="stack-grid">
            {analysisReport.contradictionCheck.contradictions.map((item) => (
              <div
                key={`${item.submissionClaim}-${item.answerClaim}`}
                className="contradiction-card"
              >
                <p className="contradiction-card__label">제출물 주장</p>
                <p className="contradiction-card__body">
                  {item.submissionClaim}
                </p>
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
  );
}
