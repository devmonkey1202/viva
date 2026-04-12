import { TeacherWorkbench } from "@/components/teacher-workbench";
import { getRuntimeStatus } from "@/lib/runtime-config";

export default function TeacherPage() {
  const runtime = getRuntimeStatus();

  return (
    <TeacherWorkbench
      aiConfigured={runtime.aiConfigured}
      managedDatabase={runtime.managedDatabase}
    />
  );
}
