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

const isMockFallbackAllowed = (input: {
  sessionPreferences?: {
    allowMockFallback?: boolean;
  };
}) => input.sessionPreferences?.allowMockFallback !== false;

export const generateQuestionSet = async (
  input: GenerateQuestionSetRequest,
) => {
  const allowMockFallback = isMockFallbackAllowed(input);

  if (!isOpenAIConfigured()) {
    if (!allowMockFallback) {
      throw new Error(
        "AI가 연결되지 않았고 mock fallback도 비활성화되어 있습니다.",
      );
    }

    return generateMockQuestionSet(input, {
      fallbackReason: "AI API key is not configured.",
    });
  }

  try {
    return await generateQuestionSetWithOpenAI(input);
  } catch (error) {
    if (!allowMockFallback) {
      throw error;
    }

    console.error("Falling back to mock question generation.", error);
    return generateMockQuestionSet(input, {
      fallbackReason:
        error instanceof Error ? error.message : "Unknown OpenAI error",
    });
  }
};

export const analyzeUnderstanding = async (
  input: AnalyzeUnderstandingRequest,
) => {
  const allowMockFallback = isMockFallbackAllowed(input);

  if (!isOpenAIConfigured()) {
    if (!allowMockFallback) {
      throw new Error(
        "AI가 연결되지 않았고 mock fallback도 비활성화되어 있습니다.",
      );
    }

    return analyzeMockUnderstanding(input, {
      fallbackReason: "AI API key is not configured.",
    });
  }

  try {
    return await analyzeUnderstandingWithOpenAI(input);
  } catch (error) {
    if (!allowMockFallback) {
      throw error;
    }

    console.error("Falling back to mock answer analysis.", error);
    return analyzeMockUnderstanding(input, {
      fallbackReason:
        error instanceof Error ? error.message : "Unknown OpenAI error",
    });
  }
};
