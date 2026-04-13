import { redirect } from "next/navigation";

import { StudentAnswerFlow } from "@/components/student-answer-flow";
import { StudentVerificationSessionSchema } from "@/lib/schemas";
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
    redirect("/session-expired");
  }

  if (verification.studentAccessState !== "open") {
    redirect("/session-expired");
  }

  const studentVerification = StudentVerificationSessionSchema.parse({
    verificationId: verification.verificationId,
    assignmentTitle: verification.assignmentTitle,
    assignmentDescription: verification.assignmentDescription,
    rubricCoreConcepts: verification.rubricCoreConcepts,
    sessionPreferences: verification.sessionPreferences,
    questionSet: verification.questionSet,
    studentAnswers: verification.studentAnswers,
    studentAccessState: verification.studentAccessState,
    hasSubmitted: Boolean(verification.analysisReport),
  });

  return <StudentAnswerFlow verification={studentVerification} />;
}
