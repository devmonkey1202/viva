import { randomUUID } from "node:crypto";

export type RequestTrace = {
  requestId: string;
  method: string;
  path: string;
  startedAt: number;
};

type LogLevel = "info" | "warn" | "error";

const traceHeaderName = "x-viva-request-id";

export const createRequestTrace = (request: Request, path: string): RequestTrace => ({
  requestId: request.headers.get(traceHeaderName) ?? randomUUID(),
  method: request.method,
  path,
  startedAt: Date.now(),
});

export const buildTraceHeaders = (trace: RequestTrace) => ({
  [traceHeaderName]: trace.requestId,
});

export const getTraceDurationMs = (trace: RequestTrace) => Date.now() - trace.startedAt;

export const logServerEvent = (
  level: LogLevel,
  event: string,
  metadata: Record<string, unknown>,
) => {
  const payload = JSON.stringify({
    level,
    event,
    recordedAt: new Date().toISOString(),
    ...metadata,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
};
