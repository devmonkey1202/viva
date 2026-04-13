import Link from "next/link";

import { EmptyState, SurfaceCard } from "@/components/ui-blocks";
import { StatusBadge } from "@/components/status-badge";

type TeacherStudentLinkCardProps = {
  verificationId: string | null;
  studentUrl: string;
  studentPath: string | null;
  studentAccessOpen: boolean;
  isPending: boolean;
  activeAction: "questions" | "analysis" | "decision" | "sync" | "access" | null;
  onCopyStudentLink: () => void;
  onSyncLatestVerification: () => void;
};

export function TeacherStudentLinkCard({
  verificationId,
  studentUrl,
  studentPath,
  studentAccessOpen,
  isPending,
  activeAction,
  onCopyStudentLink,
  onSyncLatestVerification,
}: TeacherStudentLinkCardProps) {
  return (
    <SurfaceCard
      eyebrow="학생 링크"
      title="학생 응답 링크를 공유합니다."
      description="학생은 별도 화면에서 답하고, 교사는 여기서 최신 결과를 다시 불러옵니다."
    >
      {verificationId ? (
        <div className="stack-grid">
          <div className="field-block">
            <span className="field-block__label">학생 링크</span>
            <input
              readOnly
              value={studentUrl || studentPath || ""}
              className="form-input form-input--mono"
            />
          </div>
          <div className="badge-row">
            <StatusBadge tone={studentAccessOpen ? "success" : "warning"}>
              {studentAccessOpen ? "응답 링크 사용 가능" : "응답 링크 잠금"}
            </StatusBadge>
          </div>
          <div className="button-row">
            <button
              type="button"
              onClick={onCopyStudentLink}
              className="button button--secondary"
            >
              링크 복사
            </button>
            <Link
              href={studentPath ?? "#"}
              target="_blank"
              className="button button--ghost"
            >
              학생 화면 열기
            </Link>
            <button
              type="button"
              onClick={onSyncLatestVerification}
              disabled={isPending}
              className="button button--ghost"
            >
              {activeAction === "sync" ? "동기화 중..." : "최신 결과 불러오기"}
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          title="학생 링크는 질문 생성 후 열립니다."
          description="질문 세트를 먼저 만들어야 학생 세션 링크를 생성할 수 있습니다."
        />
      )}
    </SurfaceCard>
  );
}
