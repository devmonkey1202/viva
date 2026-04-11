import { notFound } from "next/navigation";

import { StudentAnswerFlow } from "@/components/student-answer-flow";
import { getVerificationRecord } from "@/lib/verification-store";

export const dynamic = "force-dynamic";

type StudentPageProps = {
  params: Promise<{
    verificationId: string;
  }>;
};

export default async function StudentPage({ params }: StudentPageProps) {
  const { verificationId } = await params;
  const verification = await getVerificationRecord(verificationId);

  if (!verification) {
    notFound();
  }

  return <StudentAnswerFlow verification={verification} />;
}

