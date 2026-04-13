import { cookies } from "next/headers";

import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
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
          description="교사 워크벤치에서 새 세션을 만들 때 사용할 기본 설정과 현재 런타임 상태를 함께 관리합니다."
        />
        <SettingsPanel
          runtime={runtime}
          initialSettings={createDefaultWorkspaceSettingsSnapshot()}
        />
      </div>
    </main>
  );
}
