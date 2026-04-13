import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
import { StatusBadge } from "@/components/status-badge";
import { SettingsPanel } from "@/components/settings-panel";
import { PageIntro } from "@/components/ui-blocks";
import { requirePageRole } from "@/lib/server-auth";
import { getRuntimeStatus } from "@/lib/runtime-config";
import { createDefaultWorkspaceSettingsSnapshot } from "@/lib/workspace-settings";

export default async function SettingsPage() {
  const session = await requirePageRole("/settings", ["teacher", "operator"]);
  const runtime = getRuntimeStatus();

  return (
    <main className="app-shell app-shell--settings">
      <AppHeader
        current="settings"
        utility={<AuthUtility role={session.role} />}
      />
      <div className="page-stack page-stack--settings">
        <PageIntro
          variant="settings"
          eyebrow="설정"
          title="개인 작업 기본값과 현재 연결 상태를 확인합니다."
          description="이 화면은 현재 브라우저에서 새 세션을 시작할 때 쓸 기본값을 저장합니다. 보관 정책이나 권한 정책을 서버에서 강제하는 관리자 화면은 아닙니다."
          meta={
            <div className="badge-row">
              <StatusBadge tone={runtime.aiConfigured ? "success" : "warning"}>
                {runtime.aiConfigured ? "AI 연결됨" : "AI fallback"}
              </StatusBadge>
              <StatusBadge tone={runtime.managedDatabase ? "success" : "warning"}>
                {runtime.managedDatabase ? "관리형 DB" : "로컬 저장소"}
              </StatusBadge>
            </div>
          }
        />
        <SettingsPanel
          runtime={runtime}
          initialSettings={createDefaultWorkspaceSettingsSnapshot()}
        />
      </div>
    </main>
  );
}
