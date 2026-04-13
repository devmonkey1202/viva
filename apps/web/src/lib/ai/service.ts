import {
  analyzeMockUnderstanding,
  generateMockQuestionSet,
} from "@/lib/ai/mock-engine";
import {
  analyzeUnderstandingWithOpenAI,
  generateQuestionSetWithOpenAI,
  isOpenAIConfigured,
} from "@/lib/ai/openai-engine";
import type {
  AnalyzeUnderstandingRequest,
  GenerateQuestionSetRequest,
} from "@/lib/schemas";
import { logServerEvent } from "@/lib/server-observability";

type AiExecutionContext = {
  requestId: string;
  route: string;
  actorRole: string;
  verificationId?: string;
};

const isMockFallbackAllowed = (input: {
  sessionPreferences?: {
    allowMockFallback?: boolean;
  };
}) => input.sessionPreferences?.allowMockFallback !== false;

export const generateQuestionSet = async (
  input: GenerateQuestionSetRequest,
  context?: AiExecutionContext,
) => {
  const allowMockFallback = isMockFallbackAllowed(input);

  if (!isOpenAIConfigured()) {
    if (!allowMockFallback) {
      throw new Error(
        "AI가 연결되지 않았고 mock fallback도 비활성화되어 있습니다.",
      );
    }

    logServerEvent("warn", "ai.question_generation.mock_fallback", {
      requestId: context?.requestId,
      route: context?.route,
      actorRole: context?.actorRole,
      reason: "AI API key is not configured.",
    });

    return generateMockQuestionSet(input, {
      fallbackReason: "AI API key is not configured.",
    });
  }

  try {
    const result = await generateQuestionSetWithOpenAI(input);
    logServerEvent("info", "ai.question_generation.completed", {
      requestId: context?.requestId,
      route: context?.route,
      actorRole: context?.actorRole,
      modelVersion: result.modelVersion,
      fallbackUsed: false,
    });
    return result;
  } catch (error) {
    if (!allowMockFallback) {
      throw error;
    }

    logServerEvent("warn", "ai.question_generation.mock_fallback", {
      requestId: context?.requestId,
      route: context?.route,
      actorRole: context?.actorRole,
      reason: error instanceof Error ? error.message : "Unknown OpenAI error",
    });
    return generateMockQuestionSet(input, {
      fallbackReason:
        error instanceof Error ? error.message : "Unknown OpenAI error",
    });
  }
};

export const analyzeUnderstanding = async (
  input: AnalyzeUnderstandingRequest,
  context?: AiExecutionContext,
) => {
  const allowMockFallback = isMockFallbackAllowed(input);

  if (!isOpenAIConfigured()) {
    if (!allowMockFallback) {
      throw new Error(
        "AI가 연결되지 않았고 mock fallback도 비활성화되어 있습니다.",
      );
    }

    logServerEvent("warn", "ai.answer_analysis.mock_fallback", {
      requestId: context?.requestId,
      route: context?.route,
      actorRole: context?.actorRole,
      verificationId: context?.verificationId,
      reason: "AI API key is not configured.",
    });

    return analyzeMockUnderstanding(input, {
      fallbackReason: "AI API key is not configured.",
    });
  }

  try {
    const result = await analyzeUnderstandingWithOpenAI(input);
    logServerEvent("info", "ai.answer_analysis.completed", {
      requestId: context?.requestId,
      route: context?.route,
      actorRole: context?.actorRole,
      verificationId: context?.verificationId,
      classification: result.classification,
      modelVersion: result.modelVersion,
      fallbackUsed: false,
    });
    return result;
  } catch (error) {
    if (!allowMockFallback) {
      throw error;
    }

    logServerEvent("warn", "ai.answer_analysis.mock_fallback", {
      requestId: context?.requestId,
      route: context?.route,
      actorRole: context?.actorRole,
      verificationId: context?.verificationId,
      reason: error instanceof Error ? error.message : "Unknown OpenAI error",
    });
    return analyzeMockUnderstanding(input, {
      fallbackReason:
        error instanceof Error ? error.message : "Unknown OpenAI error",
    });
  }
};
