import { cookies } from "next/headers";

import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
import { StatusBadge } from "@/components/status-badge";
import { SettingsPanel } from "@/components/settings-panel";
import { PageIntro } from "@/components/ui-blocks";
import { readVivaRoleFromCookies } from "@/lib/auth";
import { getRuntimeStatus } from "@/lib/runtime-config";
import { createDefaultWorkspaceSettingsSnapshot } from "@/lib/workspace-settings";

export default async function SettingsPage() {
  const role = readVivaRoleFromCookies(await cookies());
  const runtime = getRuntimeStatus();

  return (
    <main className="app-shell app-shell--settings">
      <AppHeader
        current="settings"
        utility={role ? <AuthUtility role={role} /> : undefined}
      />
      <div className="page-stack page-stack--settings">
        <PageIntro
          variant="settings"
          eyebrow="Settings"
          title="검증 기본값과 작업 환경을 한 곳에서 정리합니다."
          description="다음 세션에 적용될 기본 정책, AI fallback, 응답 모드, export 형식과 현재 런타임 상태를 함께 관리합니다."
          meta={
            <div className="badge-row">
              <StatusBadge tone={runtime.aiConfigured ? "success" : "warning"}>
                {runtime.aiConfigured ? "AI configured" : "AI fallback"}
              </StatusBadge>
              <StatusBadge tone={runtime.managedDatabase ? "success" : "warning"}>
                {runtime.managedDatabase ? "Managed DB" : "Local store"}
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
