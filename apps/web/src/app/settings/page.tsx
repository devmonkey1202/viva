import { cookies } from "next/headers";

import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
import { SettingsPanel } from "@/components/settings-panel";
import { PageIntro } from "@/components/ui-blocks";
import { readVivaRoleFromCookies } from "@/lib/auth";
import { getRuntimeStatus } from "@/lib/runtime-config";

export default async function SettingsPage() {
  const role = readVivaRoleFromCookies(await cookies());
  const runtime = getRuntimeStatus();

  return (
    <main className="app-shell">
      <AppHeader
        current="settings"
        utility={role ? <AuthUtility role={role} /> : undefined}
      />
      <div className="page-stack">
        <PageIntro
          eyebrow="Settings"
          title="검증 정책과 작업 환경을 정리합니다."
          description="계정과 런타임 정보, 브라우저 기본 설정, 답변 수집 정책을 한 곳에서 관리합니다."
        />
        <SettingsPanel runtime={runtime} />
      </div>
    </main>
  );
}

