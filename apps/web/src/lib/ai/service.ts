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
    return generateMockQuestionSet(input);
  }

  try {
    return await generateQuestionSetWithOpenAI(input);
  } catch {
    return generateMockQuestionSet(input);
  }
};

export const analyzeUnderstanding = async (
  input: AnalyzeUnderstandingRequest,
) => {
  if (!isOpenAIConfigured()) {
    return analyzeMockUnderstanding(input);
  }

  try {
    return await analyzeUnderstandingWithOpenAI(input);
  } catch {
    return analyzeMockUnderstanding(input);
  }
};
