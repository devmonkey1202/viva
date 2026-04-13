import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/ui-blocks";
import { formatDateTime } from "@/lib/presentation";
import type { VerificationSessionPreferences } from "@/lib/schemas";

type TeacherSessionPolicyCardProps = {
  sessionPreferences: VerificationSessionPreferences;
  workspaceSettingsSavedAt: string | null;
};

export function TeacherSessionPolicyCard({
  sessionPreferences,
  workspaceSettingsSavedAt,
}: TeacherSessionPolicyCardProps) {
  return (
    <SurfaceCard
      eyebrow="Session Policy"
      title="학생 응답 방식과 export 기본값"
      description="설정 페이지의 기본값이 새 세션 생성 시 반영됩니다. 기존 세션은 저장된 정책을 그대로 유지합니다."
    >
      <div className="badge-row">
        <StatusBadge
          tone={
            sessionPreferences.studentResponseMode === "voice_or_text"
              ? "info"
              : "neutral"
          }
        >
          {sessionPreferences.studentResponseMode === "voice_or_text"
            ? "텍스트 + 음성 응답"
            : "텍스트 응답만"}
        </StatusBadge>
        <StatusBadge tone="neutral">
          기본 export {sessionPreferences.preferredExportFormat.toUpperCase()}
        </StatusBadge>
        <StatusBadge
          tone={sessionPreferences.allowMockFallback ? "warning" : "danger"}
        >
          {sessionPreferences.allowMockFallback
            ? "AI 실패 시 fallback 허용"
            : "AI 실패 시 즉시 오류"}
        </StatusBadge>
      </div>
      <p className="helper-text">
        {workspaceSettingsSavedAt
          ? `설정 반영 시각: ${formatDateTime(workspaceSettingsSavedAt)}`
          : "설정 페이지에서 기본 정책을 저장하면 다음 세션부터 반영됩니다."}
      </p>
      <div className="button-row">
        <Link href="/settings" className="button button--ghost">
          설정으로 이동
        </Link>
      </div>
    </SurfaceCard>
  );
}
