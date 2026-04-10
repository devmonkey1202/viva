import OpenAI from "openai";

import {
  answerAnalysisPrompt,
  ANSWER_ANALYSIS_PROMPT_VERSION,
  QUESTION_GENERATION_PROMPT_VERSION,
  questionGenerationPrompt,
} from "@/lib/ai/prompt-templates";
import {
  AnalysisReportSchema,
  type AnalyzeUnderstandingRequest,
  type GenerateQuestionSetRequest,
  QuestionSetSchema,
} from "@/lib/schemas";

const getApiKey = () => process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;

const getClient = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    maxRetries: Number(process.env.AI_MAX_RETRIES ?? "1"),
    timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? "20000"),
  });
};

const safeJsonParse = <T>(value: string) => JSON.parse(value) as T;

export const isOpenAIConfigured = () => Boolean(getClient());

export const generateQuestionSetWithOpenAI = async (
  input: GenerateQuestionSetRequest,
) => {
  const client = getClient();

  if (!client) {
    throw new Error("OpenAI client is not configured.");
  }

  const response = await client.responses.create({
    model: process.env.AI_FAST_MODEL ?? "gpt-5.2",
    instructions: questionGenerationPrompt,
    input: JSON.stringify({
      promptVersion: QUESTION_GENERATION_PROMPT_VERSION,
      ...input,
    }),
  });

  return QuestionSetSchema.parse(safeJsonParse(response.output_text));
};

export const analyzeUnderstandingWithOpenAI = async (
  input: AnalyzeUnderstandingRequest,
) => {
  const client = getClient();

  if (!client) {
    throw new Error("OpenAI client is not configured.");
  }

  const response = await client.responses.create({
    model: process.env.AI_REASONING_MODEL ?? "gpt-5.2",
    instructions: answerAnalysisPrompt,
    input: JSON.stringify({
      promptVersion: ANSWER_ANALYSIS_PROMPT_VERSION,
      ...input,
    }),
  });

  return AnalysisReportSchema.parse(safeJsonParse(response.output_text));
};
