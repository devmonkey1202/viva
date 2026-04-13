import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import type { VivaRole } from "@/lib/auth";
import { vivaRoleMeta } from "@/lib/auth";

type AuthUtilityProps = {
  role: VivaRole;
};

export function AuthUtility({ role }: AuthUtilityProps) {
  return (
    <>
      <span className="token-chip">{vivaRoleMeta[role].label}</span>
      <Link href="/settings" className="button button--ghost button--compact">
        설정
      </Link>
      <LogoutButton />
    </>
  );
}
