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

export const generateQuestionSet = async (
  input: GenerateQuestionSetRequest,
) => {
  if (!isOpenAIConfigured()) {
    return generateMockQuestionSet(input, {
      fallbackReason: "AI API key is not configured.",
    });
  }

  try {
    return await generateQuestionSetWithOpenAI(input);
  } catch (error) {
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
  if (!isOpenAIConfigured()) {
    return analyzeMockUnderstanding(input, {
      fallbackReason: "AI API key is not configured.",
    });
  }

  try {
    return await analyzeUnderstandingWithOpenAI(input);
  } catch (error) {
    console.error("Falling back to mock answer analysis.", error);
    return analyzeMockUnderstanding(input, {
      fallbackReason:
        error instanceof Error ? error.message : "Unknown OpenAI error",
    });
  }
};
