import { TeacherWorkbench } from "@/components/teacher-workbench";

export default function TeacherPage() {
  const aiConfigured = Boolean(
    process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY,
  );

  return <TeacherWorkbench aiConfigured={aiConfigured} />;
}
