import path from "node:path";

type RuntimeConfig = {
  aiApiKey: string;
  aiConfigured: boolean;
  aiFastModel: string;
  aiReasoningModel: string;
  aiRequestTimeoutMs: number;
  aiMaxRetries: number;
  databaseUrl: string;
  managedDatabase: boolean;
  verificationStorePath: string;
};

const readTrimmedEnv = (value: string | undefined) => value?.trim() ?? "";

const readPositiveIntEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.trunc(parsed);
};

export const getRuntimeConfig = (): RuntimeConfig => {
  const aiApiKey = readTrimmedEnv(
    process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY,
  );
  const databaseUrl = readTrimmedEnv(process.env.DATABASE_URL);
  const verificationStorePath =
    readTrimmedEnv(process.env.VERIFICATION_STORE_PATH) ||
    path.join(process.cwd(), "data", "verification-store.json");

  return {
    aiApiKey,
    aiConfigured: aiApiKey.length > 0,
    aiFastModel: readTrimmedEnv(process.env.AI_FAST_MODEL) || "gpt-5.2",
    aiReasoningModel:
      readTrimmedEnv(process.env.AI_REASONING_MODEL) || "gpt-5.2",
    aiRequestTimeoutMs: readPositiveIntEnv(
      process.env.AI_REQUEST_TIMEOUT_MS,
      20_000,
    ),
    aiMaxRetries: readPositiveIntEnv(process.env.AI_MAX_RETRIES, 1),
    databaseUrl,
    managedDatabase: databaseUrl.length > 0,
    verificationStorePath,
  };
};

export const getRuntimeStatus = () => {
  const config = getRuntimeConfig();

  return {
    aiConfigured: config.aiConfigured,
    managedDatabase: config.managedDatabase,
    storeMode: config.managedDatabase ? "managed" : "file",
    aiFastModel: config.aiFastModel,
    aiReasoningModel: config.aiReasoningModel,
    verificationStorePath: config.verificationStorePath,
  };
};
