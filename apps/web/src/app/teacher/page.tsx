import { TeacherWorkbench } from "@/components/teacher-workbench";
import { requirePageRole } from "@/lib/server-auth";
import { getRuntimeStatus } from "@/lib/runtime-config";

export default async function TeacherPage() {
  const runtime = getRuntimeStatus();
  const session = await requirePageRole("/teacher", ["teacher", "operator"]);

  return (
    <TeacherWorkbench
      aiConfigured={runtime.aiConfigured}
      managedDatabase={runtime.managedDatabase}
      role={session.role}
    />
  );
}
