import { TeacherWorkbench } from "@/components/teacher-workbench";

export default function TeacherPage() {
  const aiConfigured = Boolean(
    process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY,
  );
  const managedDatabase = Boolean(process.env.DATABASE_URL?.trim());

  return (
    <TeacherWorkbench
      aiConfigured={aiConfigured}
      managedDatabase={managedDatabase}
    />
  );
}
