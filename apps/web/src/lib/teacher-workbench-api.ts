import type {
  AnalyzeUnderstandingResponse,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetRequest,
  GenerateQuestionSetResponse,
  GetVerificationResponse,
  SaveTeacherDecisionResponse,
  StudentAccessState,
  TeacherDecisionInput,
} from "@/lib/schemas";

type ApiEnvelope = {
  message?: string;
  requestId?: string;
  code?: string;
};

const readJson = async <T>(response: Response, fallbackMessage: string) => {
  const payload = ((await response.json()) as T & ApiEnvelope) ?? {};

  if (!response.ok) {
    throw new Error(payload.message ?? fallbackMessage);
  }

  return payload as T;
};

export const fetchTeacherVerification = async (verificationId: string) => {
  const response = await fetch(`/api/verifications/${verificationId}`, {
    cache: "no-store",
  });

  return readJson<GetVerificationResponse>(
    response,
    "세션을 불러오지 못했습니다.",
  );
};

export const generateTeacherQuestionSet = async (
  payload: GenerateQuestionSetRequest,
) => {
  const response = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJson<GenerateQuestionSetResponse>(
    response,
    "질문 생성 중 오류가 발생했습니다.",
  );
};

export const analyzeTeacherVerification = async (
  payload: AnalyzeUnderstandingStoredRequest,
) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJson<AnalyzeUnderstandingResponse>(
    response,
    "분석 중 오류가 발생했습니다.",
  );
};

export const saveTeacherDecisionRequest = async (
  verificationId: string,
  decision: TeacherDecisionInput,
) => {
  const response = await fetch("/api/teacher-decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      verificationId,
      decision,
    }),
  });

  return readJson<SaveTeacherDecisionResponse>(
    response,
    "교사 판단 저장 중 오류가 발생했습니다.",
  );
};

export const updateTeacherStudentAccess = async (
  verificationId: string,
  state: StudentAccessState,
) => {
  const response = await fetch(
    `/api/verifications/${verificationId}/student-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    },
  );

  return readJson<{ verificationId: string; updatedAt: string; studentAccessState: StudentAccessState }>(
    response,
    "학생 링크 상태를 바꾸지 못했습니다.",
  );
};
