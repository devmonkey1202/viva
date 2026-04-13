import { cookies } from "next/headers";

import { TeacherWorkbench } from "@/components/teacher-workbench";
import { readVivaRoleFromCookies } from "@/lib/auth";
import { getRuntimeStatus } from "@/lib/runtime-config";

export default async function TeacherPage() {
  const runtime = getRuntimeStatus();
  const role = readVivaRoleFromCookies(await cookies());

  return (
    <TeacherWorkbench
      aiConfigured={runtime.aiConfigured}
      managedDatabase={runtime.managedDatabase}
      role={role}
    />
  );
}
