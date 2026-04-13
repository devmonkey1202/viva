import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/ui-blocks";

type TeacherSessionControlsProps = {
  verificationId: string | null;
  studentAccessOpen: boolean;
  isPending: boolean;
  activeAction: "questions" | "analysis" | "decision" | "sync" | "access" | null;
  canAnalyze: boolean;
  currentExportHref: string;
  onToggleStudentAccess: () => void;
  onSyncLatestVerification: () => void;
  onRerunAnalysis: () => void;
};

export function TeacherSessionControls({
  verificationId,
  studentAccessOpen,
  isPending,
  activeAction,
  canAnalyze,
  currentExportHref,
  onToggleStudentAccess,
  onSyncLatestVerification,
  onRerunAnalysis,
}: TeacherSessionControlsProps) {
  return (
    <SurfaceCard
      eyebrow="세션 제어"
      title="세션 제어와 재검증"
      description="학생 링크를 잠그거나, 최신 결과를 다시 불러오거나, 현재 응답으로 재분석할 수 있습니다."
    >
      <div className="button-row">
        <StatusBadge tone={studentAccessOpen ? "success" : "warning"}>
          {studentAccessOpen ? "응답 링크 사용 가능" : "응답 링크 잠금"}
        </StatusBadge>
        {verificationId ? (
          <>
            <button
              type="button"
              onClick={onToggleStudentAccess}
              disabled={isPending}
              className="button button--ghost"
            >
              {activeAction === "access"
                ? "상태 변경 중..."
                : studentAccessOpen
                  ? "링크 잠금"
                  : "링크 다시 열기"}
            </button>
            <button
              type="button"
              onClick={onSyncLatestVerification}
              disabled={isPending}
              className="button button--ghost"
            >
              {activeAction === "sync" ? "동기화 중..." : "최신 결과 불러오기"}
            </button>
            <button
              type="button"
              onClick={onRerunAnalysis}
              disabled={!canAnalyze || isPending}
              className="button button--ghost"
            >
              {activeAction === "analysis" ? "분석 중..." : "현재 응답 재분석"}
            </button>
            <Link href={currentExportHref} className="button button--secondary">
              세션 export
            </Link>
          </>
        ) : (
          <p className="helper-text">
            질문 세트를 먼저 생성해야 세션 제어 기능을 사용할 수 있습니다.
          </p>
        )}
      </div>
    </SurfaceCard>
  );
}
