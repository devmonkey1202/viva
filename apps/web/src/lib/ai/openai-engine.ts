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
import { getRuntimeConfig } from "@/lib/runtime-config";

const getApiKey = () => getRuntimeConfig().aiApiKey;

const getClient = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    maxRetries: getRuntimeConfig().aiMaxRetries,
    timeout: getRuntimeConfig().aiRequestTimeoutMs,
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
    model: getRuntimeConfig().aiFastModel,
    instructions: questionGenerationPrompt,
    input: `JSON payload:\n${JSON.stringify({
      promptVersion: QUESTION_GENERATION_PROMPT_VERSION,
      ...input,
    })}`,
    text: {
      format: {
        type: "json_object",
      },
    },
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
    model: getRuntimeConfig().aiReasoningModel,
    instructions: answerAnalysisPrompt,
    input: `JSON payload:\n${JSON.stringify({
      promptVersion: ANSWER_ANALYSIS_PROMPT_VERSION,
      ...input,
    })}`,
    text: {
      format: {
        type: "json_object",
      },
    },
  });

  return AnalysisReportSchema.parse(safeJsonParse(response.output_text));
};
